<#
.SYNOPSIS
    Exports the most recent Claude Code sessions for a project to human-readable Markdown.

.DESCRIPTION
    Claude Code's `/export` slash command only works inside an interactive TUI session and
    can't be driven headlessly. This script works around that by reading the session
    transcript files Claude Code already writes to disk
    (%USERPROFILE%\.claude\projects\<encoded-project-path>\<session-id>.jsonl) and rendering
    the last N sessions to Markdown, similar to what `/export` produces.

    It is project-agnostic: point it at any project directory and it computes that project's
    session folder the same way Claude Code does (every non-alphanumeric character in the
    absolute path becomes a dash).

.PARAMETER ProjectPath
    Path to the project whose sessions should be exported. Defaults to the current directory.

.PARAMETER Count
    Number of most-recent sessions to export. Defaults to 10.

.PARAMETER OutputDir
    Directory to write the exported .md files to. Defaults to .\doc\session-log, this repo's
    convention (see ADR 0001, decision 10). Override with another path for other projects.

.EXAMPLE
    .\Export-ClaudeSessions.ps1

.EXAMPLE
    .\Export-ClaudeSessions.ps1 -ProjectPath C:\Projects\SomeOtherRepo -Count 5 -OutputDir .\exports

.NOTES
    Reads Claude Code's internal .jsonl transcript format directly - that format is
    undocumented and can change between Claude Code versions. If exports look empty or
    malformed after a Claude Code update, this script may need adjusting.
#>
[CmdletBinding()]
param(
    [string]$ProjectPath = (Get-Location).Path,
    [int]$Count = 10,
    [string]$OutputDir = ".\doc\session-log"
)

$ErrorActionPreference = 'Stop'

function ConvertTo-ClaudeProjectSlug {
    param([Parameter(Mandatory)][string]$AbsolutePath)
    return [regex]::Replace($AbsolutePath, '[^a-zA-Z0-9]', '-')
}

function Get-TruncatedText {
    param(
        [string]$Text,
        [int]$MaxLength = 3000
    )
    if ($null -eq $Text) { return '' }
    if ($Text.Length -le $MaxLength) { return $Text }
    return $Text.Substring(0, $MaxLength) + "`n... (truncated, $($Text.Length - $MaxLength) more characters)"
}

function ConvertTo-RenderedText {
    # Renders a tool_result "content" field, which itself may be a plain string
    # or an array of {type: "text", text: ...} blocks.
    param($Content)
    if ($null -eq $Content) { return '' }
    if ($Content -is [string]) { return $Content }
    if ($Content -is [System.Collections.IEnumerable]) {
        $parts = foreach ($block in $Content) {
            if ($block.PSObject.Properties['text']) { $block.text }
            else { $block | ConvertTo-Json -Depth 10 -Compress }
        }
        return ($parts -join "`n")
    }
    return [string]$Content
}

$resolvedProjectPath = (Resolve-Path -LiteralPath $ProjectPath).Path
$slug = ConvertTo-ClaudeProjectSlug -AbsolutePath $resolvedProjectPath
$sessionsDir = Join-Path $env:USERPROFILE ".claude\projects\$slug"

if (-not (Test-Path -LiteralPath $sessionsDir)) {
    throw "No Claude Code session folder found at '$sessionsDir'. Has this project been used with Claude Code on this machine?"
}

$sessionFiles = Get-ChildItem -LiteralPath $sessionsDir -Filter '*.jsonl' -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First $Count

if (-not $sessionFiles) {
    Write-Warning "No .jsonl session files found in '$sessionsDir'."
    return
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

foreach ($file in $sessionFiles) {
    # Read as UTF-8 explicitly: Windows PowerShell's Get-Content otherwise falls back to the
    # system ANSI code page for BOM-less files, mangling every non-ASCII character (em dashes,
    # emoji) in these UTF-8 transcripts.
    $lines = [System.IO.File]::ReadAllLines($file.FullName, [System.Text.Encoding]::UTF8)

    $entries = foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try { $line | ConvertFrom-Json -ErrorAction Stop }
        catch { Write-Warning "Skipping unparseable line in $($file.Name): $($_.Exception.Message)" }
    }

    $sessionId = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $firstTimestamped = $entries | Where-Object { $_.timestamp } | Select-Object -First 1
    $startedAt = if ($firstTimestamped) { $firstTimestamped.timestamp } else { $file.LastWriteTime.ToString('o') }
    $gitBranch = ($entries | Where-Object { $_.gitBranch } | Select-Object -First 1).gitBranch
    $cwd = ($entries | Where-Object { $_.cwd } | Select-Object -First 1).cwd

    $md = New-Object System.Text.StringBuilder
    [void]$md.AppendLine("# Claude Code session $sessionId")
    [void]$md.AppendLine()
    [void]$md.AppendLine("- Started: $startedAt")
    if ($cwd) { [void]$md.AppendLine("- Project: $cwd") }
    if ($gitBranch) { [void]$md.AppendLine("- Git branch: $gitBranch") }
    [void]$md.AppendLine()
    [void]$md.AppendLine('---')

    # Maps a tool_use id to its tool name, so the matching tool_result can be labeled.
    $toolNameById = @{}

    foreach ($entry in $entries) {
        if ($entry.isSidechain) { continue }
        if ($entry.type -ne 'user' -and $entry.type -ne 'assistant') { continue }
        if (-not $entry.message) { continue }

        $content = $entry.message.content

        if ($entry.type -eq 'user' -and $content -is [string]) {
            [void]$md.AppendLine()
            [void]$md.AppendLine('## User')
            [void]$md.AppendLine()
            [void]$md.AppendLine($content)
            continue
        }

        if ($content -isnot [System.Collections.IEnumerable] -or $content -is [string]) {
            continue
        }

        $wroteHeading = $false
        foreach ($block in $content) {
            switch ($block.type) {
                'thinking' { continue }
                'text' {
                    if (-not $wroteHeading) {
                        [void]$md.AppendLine()
                        [void]$md.AppendLine($(if ($entry.type -eq 'assistant') { '## Assistant' } else { '## User' }))
                        $wroteHeading = $true
                    }
                    [void]$md.AppendLine()
                    [void]$md.AppendLine($block.text)
                }
                'tool_use' {
                    if (-not $wroteHeading) {
                        [void]$md.AppendLine()
                        [void]$md.AppendLine('## Assistant')
                        $wroteHeading = $true
                    }
                    $toolNameById[$block.id] = $block.name
                    $inputJson = Get-TruncatedText -Text ($block.input | ConvertTo-Json -Depth 10)
                    [void]$md.AppendLine()
                    [void]$md.AppendLine("**Tool call: ``$($block.name)``**")
                    [void]$md.AppendLine('```json')
                    [void]$md.AppendLine($inputJson)
                    [void]$md.AppendLine('```')
                }
                'tool_result' {
                    $toolName = $toolNameById[$block.tool_use_id]
                    $label = if ($toolName) { "Tool result: ``$toolName``" } else { 'Tool result' }
                    $resultText = Get-TruncatedText -Text (ConvertTo-RenderedText -Content $block.content)
                    [void]$md.AppendLine()
                    [void]$md.AppendLine("### $label")
                    [void]$md.AppendLine('```')
                    [void]$md.AppendLine($resultText)
                    [void]$md.AppendLine('```')
                }
                default { continue }
            }
        }
    }

    $stamp = try { ([datetimeoffset]$startedAt).ToString('yyyyMMdd-HHmmss') } catch { $file.LastWriteTime.ToString('yyyyMMdd-HHmmss') }
    $outFile = Join-Path $OutputDir "$stamp-$sessionId.md"
    # Write UTF-8 without a BOM: Set-Content -Encoding utf8 on Windows PowerShell adds one,
    # which some Markdown renderers show as a stray character at the top of the file.
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath($outFile), $md.ToString(), $utf8NoBom)
    Write-Host "Wrote $outFile"
}

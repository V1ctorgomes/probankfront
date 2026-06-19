# Probank Frontend - helpers de Git
# Uso no terminal: . .\git-helpers.ps1

$env:GIT_AUTHOR_NAME = "V1ctorgomes"
$env:GIT_AUTHOR_EMAIL = "V1ctorgomes@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "V1ctorgomes"
$env:GIT_COMMITTER_EMAIL = "V1ctorgomes@users.noreply.github.com"

function pf-status {
  Write-Host "`n=== probankfront (frontend) ===" -ForegroundColor Cyan
  git status
  Write-Host "`nUltimo commit:" -ForegroundColor DarkGray
  git log -1 --oneline
  Write-Host "Remote: $(git remote get-url origin)`n" -ForegroundColor DarkGray
}

function pf-commit {
  param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Message
  )

  git add -A
  git status --short
  git commit -m $Message
}

function pf-push {
  param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Message
  )

  pf-commit -Message $Message
  git push origin main
}

function pf-sync {
  git pull origin main
}

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "Probank FRONTEND pronto" -ForegroundColor Green
Write-Host "Repo: https://github.com/V1ctorgomes/probankfront" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Comandos:" -ForegroundColor Yellow
Write-Host "  pf-status              -> ver status"
Write-Host "  pf-commit 'mensagem'   -> add + commit"
Write-Host "  pf-push 'mensagem'     -> add + commit + push"
Write-Host "  pf-sync                -> git pull"
Write-Host ""

pf-status

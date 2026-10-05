$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$secretsPath = Join-Path $PSScriptRoot '.env.local'

if (-not (Test-Path -LiteralPath $secretsPath)) {
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $passwordBytes = New-Object byte[] 24
    $secretBytes = New-Object byte[] 48
    $rng.GetBytes($passwordBytes)
    $rng.GetBytes($secretBytes)
    $rng.Dispose()
    $password = [Convert]::ToBase64String($passwordBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    $jwtSecret = [Convert]::ToBase64String($secretBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    @(
        'APP_LOGIN_USERNAME=avinashsahoo197@gmail.com'
        "APP_LOGIN_PASSWORD=$password"
        "JWT_SECRET=$jwtSecret"
    ) | Set-Content -LiteralPath $secretsPath -Encoding ascii
    Write-Host 'Created local operator credentials:' -ForegroundColor Green
    Write-Host 'Username: avinashsahoo197@gmail.com'
    Write-Host "Password: $password"
    Write-Host "These credentials are saved in $secretsPath (ignored by Git). Keep them private."
}

Get-Content -LiteralPath $secretsPath | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

$env:DB_URL = 'jdbc:h2:file:./api/data/mybillbuddy;MODE=MySQL;DB_CLOSE_ON_EXIT=FALSE'
$env:DB_USERNAME = 'sa'
$env:DB_PASSWORD = ''
$env:CORS_ALLOWED_ORIGIN = 'http://localhost:5173'

# Some Windows Java installs report C:\ as user.home, which makes Maven look
# for dependencies under C:\.m2 even though the project cache is in the user profile.
$previousJavaToolOptions = $env:JAVA_TOOL_OPTIONS
$homeOption = "-Duser.home=$env:USERPROFILE"
$env:JAVA_TOOL_OPTIONS = if ([string]::IsNullOrWhiteSpace($previousJavaToolOptions)) { $homeOption } else { "$previousJavaToolOptions $homeOption" }

Push-Location $projectRoot
try {
    $userDirectory = Split-Path -Parent $projectRoot
    $mavenRepository = Join-Path $userDirectory '.m2\repository'
    mvn -o "-Dmaven.repo.local=$mavenRepository" -f api/pom.xml spring-boot:run '-Dspring-boot.run.profiles=local'
    if ($LASTEXITCODE -ne 0) { throw "API stopped with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
    $env:JAVA_TOOL_OPTIONS = $previousJavaToolOptions
}

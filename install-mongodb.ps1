# Create a directory for MongoDB
New-Item -ItemType Directory -Force -Path "C:\data\db"

# Download MongoDB installer
$url = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.8-signed.msi"
$output = "$env:TEMP\mongodb.msi"
Invoke-WebRequest -Uri $url -OutFile $output

# Install MongoDB
Start-Process msiexec.exe -ArgumentList "/i $output ADDLOCAL=ALL /qn" -Wait

# Add MongoDB to PATH
$env:Path += ";C:\Program Files\MongoDB\Server\6.0\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)

# Create MongoDB service
Start-Process mongod -ArgumentList "--install --serviceName MongoDB --serviceDisplayName MongoDB" -Wait

# Start MongoDB service
Start-Service MongoDB

Write-Host "MongoDB has been installed and started successfully."

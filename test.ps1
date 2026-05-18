$response = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing
Write-Host "Status Code:" $response.StatusCode
Write-Host "Content Length:" $response.Content.Length
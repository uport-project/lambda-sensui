# Secrets

`sls encrypt -n SECRETS:VARIABLE_NAME -v myvalue [-k keyId]`

`sls decrypt [-n SECRETS:VARIABLE_NAME]`

Run Local

`AWS_PROFILE="profile" sls invoke local`

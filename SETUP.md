# Local Setup
1. Check your node version

   ```node -v```
   
   Make sure you use node 6 or 8.10 (Although for node 8.10, `npm test` 4 tests failed; for node 6, 1 test failed ). 
   
   I recommend using nvm (https://github.com/creationix/nvm) to manage different node.js versions (`nvm install 8.10; nvm use 8.10`).
2. Install serverless

   ```npm install -g serverless```
3. Install all dependencies

   ```npm install```

   run `npm test`, for node 8.10, `npm test` 4 tests failed; for node 6, 1 test failed. (FIXME)
4. Make sure you have an AWS account. Set up AWS credentials: https://serverless.com/framework/docs/providers/aws/guide/credentials/

   In this step, make sure your `~/.aws/credentials` is setup correctly. And you exported your environment variables:
   
   ```
   export AWS_ACCESS_KEY=[AWS_ACCESS_KEY]
   export AWS_SECRET_ACCESS_KEY=[AWS_SECRET_ACCESS_KEY]
   ```
5. In IAM management console, create a key for develop: https://console.aws.amazon.com/iam/home#/encryptionKeys/us-west-2

   If you want to deploy to master too, create another key for master.
   Make sure the keys you created are in the correct region (`us-west-2`). If you decide to create keys in another reason, make sure to change region configuration in other places too.
6. Setup PostgreSQL locally
    
    Start server: `pg_ctl -D /usr/local/var/postgres start &`
    (Stop server: `pg_ctl -D /usr/local/var/postgres stop`)
    
    Create two tables:
    - `tx`: https://github.com/ConsenSys/lambda-sensui/blob/master/sql/create_tx.sql
    - `nounces`: https://github.com/ConsenSys/lambda-sensui/blob/master/sql/create_nonces.sql
7. Set up Slack incoming webhooks: https://api.slack.com/incoming-webhooks, get `SLACK_URL` and `SLACK_CHANNEL`

    A message will be posted to slack whenever `checkBalances` and the fund is lower than a threshold.
    (In our case, it really depends on how our client want to be notified, it does not have to be on slack.)
8. Delete the old `kms-secrets.develop.us-west-2.yml` and `kms-secrets.master.us-west-2.yml`. 

      Generate your own using the following command:

      ```sls encrypt -n SECRETS:[variable] -v [value] [-k key_for_stage] [-s stage]```
   
      Use the key you generated in step 5 to replace `key_for_stage`, and specify `develop` for `stage`. The first time you run the command, a file `kms-secrets.develop.us-west-2.yml` will be generated.
 
      If you want to deploy to master, use the other key you generated in step 5 to replace `key_for_stage`, and specify `master` for `stage`, a file `kms-secrets.master.us-west-2.yml` will be generated.
   
      You only need to specify `[-k key_for_stage]` the first time you run the command for each stage.
   
      You should encrypt the following `variable` and its corresponding `value`.
      ```
      NISABA_PUBKEY // This is the FUEL_TOKEN_PUBLIC_KEY you specified in lambda-nisaba
      SEED  // You need to have a funding wallet, and this is the 12 word mnemonic for that funding wallet
      SLACK_URL // from step 7
      SLACK_CHANNEL // from step 7
      PG_URL=postgresql://localhost
      ```
   
      Run `sls decrypt` to check the encryption works correctly.
9. Now you can run locally

      ```sls invoke local -f [function] -d [data]```

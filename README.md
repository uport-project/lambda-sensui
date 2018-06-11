# lambda-sensui
The lambda-sensui repository consists of a tx funding service originally developed by the uPort team. The purpose of the service is to make transactions feeless for the end user, and forward those costs to the application itself, providing a much better user experience for the Ethereum-based Dapps. Feeless transactions for users is a mainstream expectation, as many consumers are not used to paying transaction fees on traditional applications, particularly not for things like form submission or logging in. By leveraging repositories like this one, you can develop a much more streamlined application UX for end-users, and make the use of your application more akin to the speed and simplicity of traditional apps (with the power of the blockchain of course!).

The build leverages the [serverless framework](https://serverless.com/learn/) provided by [AWS Lambda](https://aws.amazon.com/lambda/) and AWS S3 to save tx history. AWS Lambda lets you run code without provisioning or managing servers. You pay only for the compute time you consume - there is no charge when your code is not running.)

[![CircleCI](https://circleci.com/gh/uport-project/lambda-sensui.svg?style=svg&circle-token=b2953f00d5cd866df70f0c221e2018e6ab6683b8)](https://circleci.com/gh/uport-project/lambda-sensui)

[![codecov](https://codecov.io/gh/uport-project/lambda-sensui/branch/master/graph/badge.svg?token=h0GWHsuPtL)](https://codecov.io/gh/uport-project/lambda-sensui)

## Repository Basics

### What is [AWS Lambda](https://aws.amazon.com/lambda/)?
AWS Lambda lets you run code without provisioning or managing servers. You pay only for the compute time you consume - there is no charge when your code is not running.

With Lambda, you can run code for virtually any type of application or backend service - all with zero administration. Just upload your code and Lambda takes care of everything required to run and scale your code with high availability. You can set up your code to automatically trigger from other AWS services or call it directly from any web or mobile app.

### What is [Serverless](https://serverless.com/learn/)?
Just like wireless internet has wires somewhere, serverless architectures still have servers somewhere. What ‘serverless’ really means is that, as a developer you don’t have to think about those servers. You just focus on code.

### Serverless Architectures with AWS Lambda
Using AWS Lambda as the logic layer of a serverless application can enable faster development speed and greater experimentation – and innovation — than in a traditional, server-based environment. Many serverless applications can be fully functional with only a few lines of code and little else.

Examples of fully-serverless-application use cases include:

- Web or mobile backends – Create fully-serverless, mobile applications or websites by creating user-facing content in a native mobile application or static web content in an S3 bucket. Then have your front-end content integrate with Amazon API Gateway as a backend service API. Lambda functions will then execute the business logic you’ve written for each of the API Gateway methods in your backend API.
- Chatbots and virtual assistants – Build new serverless ways to interact with your customers, like customer support assistants and bots ready to engage customers on your company-run social media pages. The Amazon Alexa Skills Kit (ASK) and Amazon Lex have the ability to apply natural-language understanding to user-voice and freeform-text input so that a Lambda function you write can intelligently respond and engage with them.
- Internet of Things (IoT) backends – AWS IoT has direct-integration for device messages to be routed to and processed by Lambda functions. That means you can implement serverless backends for highly secure, scalable IoT applications for uses like connected consumer appliances and intelligent manufacturing facilities.
Using AWS Lambda as the logic layer of a serverless application can enable faster development speed and greater experimentation – and innovation — than in a traditional, server-based environment.

To learn more about Serverless Architectures with AWS Lambda, check out [this publication](https://d1.awsstatic.com/whitepapers/serverless-architectures-with-aws-lambda.pdf) that goes through the whole build

### So How Does this All Come Together w/ lambda-sensui?
To put it simply, this is out the Lambda Sensui server helps sheild front end dapp users from paying transaction costs: 
1. User goes on application and registers a transaction (let's say their submitting a report, and they want to hash that report on chain). We don't want to have them need to pay any transaction costs of course!
2. User signs the transaction (instead of paying for it) and creates a signed message, which includes the user's address and any information relevant to the submitted report. 
3. Signed transaction message is sent to the sensui server, which then commits the message on the blockchain and pays for the transaction. By using the serveless AWS lambda architecture, it is easy to set up our service to help do this (albeit, it is centralized). 
4. User transaction complete!

### How is the Repository Organized?
The following list breakdown the folder architecture within the repository, explaining where everything is at (and what those part of the repository are responsible for). Hopefully, through this explanation, you can localize different parts of the repository that you want to change/fix/enhance: 

1. **Serverless.yml** - Serverless.yml is the configuration the CLI uses to deploy your code to your provider of choice. The file denotes the entire architecture of the server, including the provider, the plugins, and the functions. The file is the outline (or the index) of your entire API and is the best reference to determine how your API will work. Here's a description of what each part of this file means: 

- **service** - The name of your API (or your `service`)

- **provider** - The `provider` block defines where your service will be deployed. For AWS Lambda we need to be careful of which version of node.js we are running (the repo runs 6.10, but it seems that AWS Lambda can now run v8.10 as of 4/2/18). The repo sets the stage as development (as opposed to production) and sets the location of the server in the western region of the U.S. Every AWS Lambda function needs permission to interact with other AWS infrastructure resources within your account. These permissions are set via an AWS IAM Role. 

You can set permission policy statements within this role via the `provider.iamRoleStatements` property. The permissions we set in this service are allowing the operation of an S3 database instance and the use of `KMS:Decrypt`, which helps us encrypt and decrypt our service secrets (our mnemonic to our funding wallet, etc.).

The `environment` property allows you to apply an environment variable configuration to all functions in your service. Environment variables configured at the function level are merged with those at the provider level, so your function with specific environment variables will also have access to the environment variables defined at the provider level. If an environment variable with the same key is defined at both the function and provider levels, the function-specific value overrides the provider-level default value. Here, we've set `SECRETS` as our global variable across all functions within the service as an authentication method for accessing the APIs capabilities. The `serverless-kms-secrets` npm resource is what allows us to conveniently encrypt and decrypt our service and pair that value with the `SECRETS` environment variable. 

The `plugins` property includes npm resources we need for the service to function correctly. We use the `serverless-webpack`
and `serverless-kms-secrets` npm resources. 

The `customs` property allows us to account for certain configurations required by our plugin features. 

The `functions` block defines what code to deploy. These are the methods of your API - or your API calls. 

2. **src folder** - all of the logic of the repo is stored here, particularly in the api_handler.js file. We will account for special files/folders in this path below: 

- **api_handler** - central file with all of service's core functions (that result in the development of api calls for different functions)

- **src/lib folder** - contains all of the needed scripts to enable the 'handler' files to work properly. Many of these scripts take care of interacting with the ethereum blockchain. 

3. **Other Notable Files**

- **SECRETS.md** - This file provides the kms commands that you need to use to both encrypt (and set) your SECRETS for your service and decrypt those secrets when needed. The structure of the secrets provided in this service is the following: 
```
{
  PG_URL: [the postgress url associated with the service to commit data to the database, and query data from the database],
  SEED: [12 word mnemonic used for funding wallet - note that you can derive multiple wallets from one seed. The mnemonic is an encoding for a seed value. That seed is then converted into the master private key],
  NISABA_PUBKEY: [the aws lambda public key for your nisaba service],
  SLACK_URL: [Incoming Webhooks are a simple way to post messages from external sources into Slack. They make use of normal HTTP requests with a JSON payload that includes the message text and some options. Message Attachments can also be used in Incoming Webhooks to display richly-formatted messages that stand out from regular chat messages. See more at https://api.slack.com/incoming-webhooks]
}
```

- **kms-secrets.develop.us-west-2.yml** - A file that is automatically generated once secrets are encrypted by the sls encryption command noted in the SECRETS.md file. This is for the develop stage service. Create a KMS key in AWS IAM service, under Encryption keys. Collect the key id, which is the remaining part of the key ARN. 

- **kms-secrets.master.us-west-2.yml** - A file that is automatically generated once secrets are encrypted by the sls encryption command noted in the SECRETS.md file. This is for the master stage service. Create a KMS key in AWS IAM service, under Encryption keys. Collect the key id, which is the remaining part of the key ARN.

### How are transactions passed through from the Dapp to the sensui service (and paid for)?
The following outlines the **Transaction Creation & Signage Process**:

**Note:** All of this is coordinated by the relay.js file in the handlers folder
**Note:** All functions being used in the following process are in the EthereumMgr.js file in the library folder

1. Get initial user input of metaSignedTx and blockchain network

2. Submit input into SignTx Function and get a signedRawTx via following process:

- Creates a new transaction taking in the metaSignedTx txHex
- Sets the gasPrice and nonce for the new transaction
- Sets the gasLimit to the estimatedgas + 1000
- Creates 'rawTx' by serializing the new transaction and converting to hex strings
- Signs raw transaction with signer and returns signedRawTx

3. Gets txHash from sending raw transction via sendRawTransaction, which does the following

- Check if signedRawTx is legit
- Using web3js to send transaction on respective blockchain using the follwoing function (e.g. eth.sendRawTransactionAsync)

4. Returns txhash of transaction sent on blockchain. The end transaction has the following object body:
```
  tx = {
    blockHash,
    blockNumber,
    from,
    gas,
    gasPrice,
    hash,
    input,
    nonce,
    to,
    transactionIndex,
    value
  }
```

### Datastore Schema
The Sensui service leverages a centralized, off-chain sotre in order to provide better consistency than querying the blockchain for past transactiond data. The service leverages an [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html) instance to save transaction and nonce data from transactions being passed through the service. The following are the two tables within the PostgreSQL database (given the initial repository codebase): 

**Table 1: Nonce**
| Address       | Network       | Nonce |
| ------------- |:-------------:| -----:|
|               |               |       |

**Table 2: Tx**
| Tx_Hash       | Network       | Tx_Options  | Tx_Receipt |
| ------------- |:-------------:| -----------:|-----------:|
|               |               |             |            |


### How do we start this up?
1. Open your terminal and choose a folder path you'd like to store the project in 

2. Use the command 'git clone [github repo url here]' to clone the project in that folder

3. Make sure that you have serverless on your computer if not, follow these steps: https://serverless.com/learn/quick-start/

4. Make sure that you have a AWS IAM account (if not follow the guide in step 3 to completion to get familiar). 

5. Go back to your terminal in the project folder and use `npm install` command make sure that `serverless-webpack` and `serverless-kms-secrets` npm resources are installed.

6. Create a KMS key in AWS IAM service, under Encryption keys. Collect the key id, which is the remaining part of the key ARN. You need to create a key for each development stage of your service. 

7. Use the encryption command (on your terminal which should be in the folder path of the project) to set and encrypt you secrets for each of your development stage services via the following: 

```
sls encrypt -n SECRET_VARIABLE_NAME -v SECRET_VARIABLE_VALUE -s STAGE_YOUR_SETTING_SECRET_FOR 
```

Since you indicated which stage your encypting the secret for, it will determine which KMS key to use automatically from AWS.

8. Make sure to re-name your service in the `serverless.yml` file to something relevant that your service does 

9. Create an endpoint that points to where your service lives using the command `sls deploy`. This will generate a url to use for calling the different endpoints indicated in your API. Remember, we indicated what these endpoints were in the `serverless.yml` file in the functions sub-sections called `events`, where we define the mapping of the API functions to the http endpoints of `v1/fund`, `fund`, `v2/relay`, `relay`, and `checkPending`. 

10. You also need to ensure that you have a NISABA like service running as well. Remember, all this is is another serverless service on AWS lambda that handles JWT token creation given a user signing up and logging in. This service should interact with an authentication challenge like a text reponse challenge or captcha challenge when the user is first signing up. Resources like [nexmo](https://www.nexmo.com/products/sms) are very helpful for this purpose and can extend usage of your application to both web and mobile. 

## API Description

### Fund address
This endpoints tries to send funds to the address on the `from` field of the transaction.
The `from` field needs to match with the `deviceKey` in the Authorization token.

Sensui, does some limit check before actually sending the funds. If sensui funds an attempt to abuse a `429 Too many connections` is returned

The endpoint is private, only valid tokens from `nisaba` are allowed.

### Endpoints

## Fund
`POST /fund`

#### Header
```
Authorization: Bearer <jwt token>
```
The authorization header needs a JWT token that is signed by the nisaba service (a build that very much resembles this one, in that it also uses the serverless framework and AWS lambda. The JWT token is generated from the following control flow (for uPort): 

1. User is signing up on uPort, which requests the users phone number and/or that the user complete a captcha challenge 
2. The user submits their phone number and recieves a text with a secret code and/or completes captcha challenge 
3. Upon successful completion, a JWT token is created and then signed by the nisaba service (becoming a 'nisaba token' as referenced in the comments in the code 
4. This token is associated with the user and allows them to use the methods of the API and make calls 

#### Body
```
{
  tx: <signedTx>,
  blockchain: <blockchain name>
}
```
#### Response

| Status |     Message    |                                  |
|:------:|----------------|----------------------------------|
| 200    | Ok.            | address funded                   |
| 400    | Bad request    | No JSON or paramter missing      |
| 401    | Forbidden      | Fuel token not granted by nisaba |              
| 403    | Forbidden      | JWT token missing or invalid     |
| 429    | Abuse | Abusing gasPrice or funds not needed      |
| 500    | Internal Error | Internal error                   |

#### Response data
```
{
  txHash: <tx hash>
}
```

## Relay
`POST /relay`

#### Header
```
Authorization: Bearer <jwt token>
```

#### Body
```
{
  metaSignedTx: <metaSignedTx>,
  blockchain: <blockchain name>
}
```
#### Response

| Status |     Message    |                               |
|:------:|----------------|-------------------------------|
| 200    | Ok.            | address funded
| 400    | Bad request      | No JSON or paramter missing  |
| 401    | Forbidden      | Fuel token not granted by nisaba |
| 403    | Forbidden      | Invalid metaTx signature |
| 500    | Internal Error | Internal error                |

#### Response data
```
{
  txHash: <tx hash>
}
```

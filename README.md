# lambda-sensui
The lambda-sensui repository consists of a tx funding service originally developed by the uPort team. The purpose of the service is to make transactions feeless for the end user, and forward those costs to the application itself, providing a much better user experience for the Ethereum-based Dapps. Feeless transactions for users is a mainstream expectation, as many consumers are not used to paying transaction fees on traditional applications, particularly not for things like form submission or logging in. By leveraging repositories like this one, you can develop a much more streamlined application UX for end-users, and make the use of your application more akin to the speed and simplicity of traditional apps (with the power of the blockchain of course!).

The build leverages the [serverless framework](https://serverless.com/learn/) provided by [AWS Lambda](https://aws.amazon.com/lambda/). AWS Lambda lets you run code without provisioning or managing servers. You pay only for the compute time you consume - there is no charge when your code is not running.)

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
1. **Serverless.yml** - Serverless.yml is the configuration the CLI uses to deploy your code to your provider of choice. The file denotes the entire architecture of the server, including the provider, the plugins, and the functions.

2. **src folder** - all of the logic of the repo is stored here, particularly in the api_handler.js file. We will account for special files/folders in this path below: 
- **api_handler** - central file with all of service's core functions (that result in the development of api calls for different functions)
- **src/lib folder** - contains all of the needed scripts to enable the 'handler' files to work properly. Many of these scripts take care of interacting with the ethereum blockchain. 

[To be Continued ... ]


### How do we start this up?
1. Open your terminal and choose a folder path you'd like to store the project in 
2. Use the command 'git clone [github repo url here]' to clone the project in that folder
3. Make sure that you have serverless on your computer if not, follow these steps: https://serverless.com/learn/quick-start/
4. Make sure that you have a AWS IAM account (if not follow the guide in step 3 to completion to get familiar). 
5. Once you have all your AWS dev credentials, and you have serverless on your computer, you should be able to use the 'sls deploy' command in your terminal (making sure to be in the same directory as the project). This will start up the server! Of course, to truly see it working in action, you will want to connect to one of your dapps to begin signing and forwarding signed messages to the server

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

#### Body
```
{
  tx: <signedTx>,
  blockchain: <blockchain name>
}
```
#### Response

| Status |     Message    |                               |
|:------:|----------------|-------------------------------|
| 200    | Ok.            | address funded
| 400    | Bad request      | No JSON or paramter missing  |
| 401    | Forbidden      | Fuel token not granted by nisaba |               |
| 403    | Forbidden      | JWT token missing or invalid  |
| 429    | Abuse | Abusing gasPrice or funds not needed          |
| 500    | Internal Error | Internal error                |

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

# lambda-sensui
uPort Funding Service

[FAQ and helpdesk support](http://bit.ly/uPort_helpdesk)

[![CircleCI](https://circleci.com/gh/uport-project/lambda-sensui.svg?style=svg&circle-token=b2953f00d5cd866df70f0c221e2018e6ab6683b8)](https://circleci.com/gh/uport-project/lambda-sensui)

[![codecov](https://codecov.io/gh/uport-project/lambda-sensui/branch/master/graph/badge.svg?token=h0GWHsuPtL)](https://codecov.io/gh/uport-project/lambda-sensui)

## API Description

### RPC endpoint
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

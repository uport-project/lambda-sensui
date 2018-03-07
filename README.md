# lambda-sensui
uPort tx funding service

[![CircleCI](https://circleci.com/gh/uport-project/lambda-sensui.svg?style=svg&circle-token=b2953f00d5cd866df70f0c221e2018e6ab6683b8)](https://circleci.com/gh/uport-project/lambda-sensui)

[![codecov](https://codecov.io/gh/uport-project/lambda-sensui/branch/master/graph/badge.svg?token=h0GWHsuPtL)](https://codecov.io/gh/uport-project/lambda-sensui)

## API Description

### Fund address
This endpoints tries to send funds to the address on the `from` field of the transaction.
The `from` field needs to match with the `deviceKey` in the Authorization token.

Sensui, does some limit check before actually sending the funds. If this limits are reached a `429 Too many connections` is returned

The endpoint is private, only valid tokens from `nisaba` are allowed.

#### Endpoints

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
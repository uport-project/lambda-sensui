const AWS = require("aws-sdk");

//Check if all the Mgr in the array have their secrets sets
const isSecretsSet = (secretsMgrArr) => {
    for(let i=0; i < secretsMgrArr.length; i++){
        if(!secretsMgrArr[i].isSecretsSet()) return false;
    }
    return true;
}
  
const setSecrets = (secretsMgrArr,secrets) => {
    for(let i=0; i < secretsMgrArr.length; i++){
        secretsMgrArr[i].setSecrets(secrets)
    }
}
  
//check if secrets are set
module.exports = createSecretsWrappedHandler = (secretsMgrArr, handler) => {
  return (event, context, callback) => {
    if (!isSecretsSet(secretsMgrArr)) {
      const kms = new AWS.KMS();
      kms
      .decrypt({
        CiphertextBlob: Buffer(process.env.SECRETS, "base64")
      })
      .promise()
      .then(data => {
        const decrypted = String(data.Plaintext);
        setSecrets(secretsMgrArr,JSON.parse(decrypted));
        handler(event, context, callback);
      });
    } else {
      handler(event, context, callback);
    }
  }
};
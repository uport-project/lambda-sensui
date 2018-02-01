import SlackWebhook from 'slack-webhook'

class SlackMgr {

    constructor() {
        this.slackObj=null
    }
    
    isSecretsSet(){
        return (this.slackObj !== null);
    }
    
    setSecrets(secrets){
        this.slackObj = new SlackWebhook(secrets.SLACK_URL,{
              defaults: {
                channel: secrets.SLACK_CHANNEL,
              }
            }
        )
    }
    
    async sendMessage(slackMsg){
        if(!slackMsg) throw('no slackMsg')
        if(!this.slackObj) throw('slackObj not set')   

        return this.slackObj.send(slackMsg);
    }
}
module.exports = SlackMgr

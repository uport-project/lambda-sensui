import networks from '../lib/networks'
import thresholds from '../lib/thresholds'
import pack from '../../package'
const Unit = require('ethjs-unit');


class CheckBalancesHandler {
    constructor (ethereumMgr,slackMgr) {
      this.ethereumMgr = ethereumMgr
      this.slackMgr = slackMgr
    }
  
    async handle(event, context, cb) {
        console.log(event)
        console.log(context)

        const sp=context.functionName.slice(pack.name.length+1).split('-')
        let stage=sp[0]
        console.log('stage:' +stage)

        let addr=this.ethereumMgr.getAddress();
        console.log('checking addr:'+addr)

        for (const network in networks) {
            let balanceWei=await this.ethereumMgr.getBalance(addr,network);
            let threshold = thresholds[network][stage]
            let rpcUrl = networks[network].rpcUrl

            console.log('['+network+'] balance: '+balanceWei+' threshold: '+threshold)

            if(balanceWei < threshold){
                console.log("HEY!!!")
                let etherscanHost=(network==='mainnet')?'':network+'.';

                let thresholdEth=Unit.fromWei(threshold, 'ether');
                let balanceEth=Unit.fromWei(balanceWei, 'ether');
                let text='Balance for *'+pack.name+'-'+stage+'* on '+rpcUrl+' below threshold!'
                let addrUrl='<https://'+etherscanHost+'etherscan.io/address/'+addr+'|'+addr+'>'

                let slackMsg={
                  username: 'Balance Checker',
                  icon_emoji: ':robot_face:',
                  attachments: [
                    {
                      fallback: text,
                      pretext: '<!here|here>: '+text,
                      "color": "danger",
                      "fields": [
                        {"title": "Threshold (Wei)","value": threshold.toString(),"short": true},
                        {"title": "Threshold (Eth)","value": thresholdEth,"short": true},
                        {"title": "Balance (Wei)","value": balanceWei,"short": true},
                        {"title": "Balance (Eth)","value": balanceEth,"short": true}
                      ],
                      footer: 'Send some :heart: to '+addrUrl
                    }
                  ],
                }
                //console.log(JSON.stringify(slackMsg))
                this.slackMgr.sendMessage(slackMsg)

            }
        }

        cb(null)
    }
}
module.exports = CheckBalancesHandler
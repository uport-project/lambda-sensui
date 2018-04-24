import networks from "../lib/networks";
import pack from "../../package";

class FixNoncesHandler {
  constructor(ethereumMgr) {
    this.ethereumMgr = ethereumMgr;
  }

  async handle(event, context, cb) {
    console.log(event);
    console.log(context);

    const sp = context.functionName.slice(pack.name.length + 1).split("-");
    let stage = sp[0];
    console.log("stage:" + stage);

    let addr = this.ethereumMgr.getAddress();
    console.log("checking addr:" + addr);

    for (const network in networks) {
      let rpcUrl = networks[network].rpcUrl;
      let netNonce = await this.ethereumMgr.getTransactionCount(addr, network);
      let dbNonce = await this.ethereumMgr.readNonce(addr, network);

      if (!dbNonce) {
        console.log("no nonce to re-sync");
      } else {
        console.log(
          "[" + network + "] netNonce: " + netNonce + " dbNonce: " + dbNonce
        );
        if (netNonce == 0) {
          await this.ethereumMgr.setNonce(addr, network, parseInt(0));
        } else if (dbNonce >= netNonce) {
          console.log("HEY!!!");
          await this.ethereumMgr.setNonce(
            addr,
            network,
            parseInt(netNonce - 1)
          );
          console.log("Fixed with: " + parseInt(netNonce - 1));
        }
      }
    }
    cb(null);
  }
}
module.exports = FixNoncesHandler;

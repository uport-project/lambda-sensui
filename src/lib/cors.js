module.exports = createCorsHandler = (handler) => {
    return (event, context, callback) => {
        handler.handle(event, context, (err, resp) => {
            let response
            let extraHeaders;
            if (err == null) {
              if(resp.code==302){
                //Redirect logic
                response = {
                  statusCode: 302,
                  body: "Redirect to: "+resp.location
                }
                extraHeaders={
                  'Location': resp.location
                }
              }else{
                response = {
                  statusCode: 200,
                  body: JSON.stringify(resp)
                };
              }
            } else {
              //console.log(err);
              let code = 500;
              if (err.code) code = err.code;
              let message = err;
              if (err.message) message = err.message;
        
              response = {
                statusCode: code,
                body: JSON.stringify(message)
              };
            }
        
            //CORS
            response.headers={
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true,
              ...extraHeaders
            };
            
            callback(null, response);
          });
    }
}



const createJsendHandler = require('../jsend');

describe('createJsendHandler', () => {

    test('ok', (done) => {
        const handler = {
            handle: (event,context,cb) => {
                cb(null,{good: "data"});
                return;
            }
        }
        const jsendHandler = createJsendHandler(handler);
        jsendHandler({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual('{\"status\":\"success\",\"data\":{\"good\":\"data\"}}');
            expect(res.headers['Access-Control-Allow-Origin']).toEqual('*')
            expect(res.headers['Access-Control-Allow-Credentials']).toEqual(true)
            done();
        })
    })

    test('error without code', (done) => {
        const handler = {
            handle: (event,context,cb) => {
                cb("bad");
                return;
            }
        }
        const jsendHandler = createJsendHandler(handler);
        jsendHandler({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual('{\"status\":\"error\",\"message\":\"bad\"}');
            expect(res.headers['Access-Control-Allow-Origin']).toEqual('*')
            expect(res.headers['Access-Control-Allow-Credentials']).toEqual(true)
            done();
        })
    })


    test('error with code', (done) => {
        const handler = {
            handle: (event,context,cb) => {
                cb({code: 401, message: "bad"});
                return;
            }
        }
        const jsendHandler = createJsendHandler(handler);
        jsendHandler({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual('{\"status\":\"error\",\"message\":\"bad\"}');
            expect(res.headers['Access-Control-Allow-Origin']).toEqual('*')
            expect(res.headers['Access-Control-Allow-Credentials']).toEqual(true)
            done();
        })
    })

});

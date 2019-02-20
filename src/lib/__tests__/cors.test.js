const createCorsHandler = require('../cors');

describe('createCorsHandler', () => {

    test('redirect', (done) => {
        const handler = {
            handle: (event,context,cb) => {
                cb(null,{code: 302, location: "loc"});
                return;
            }
        }
        const corsHandler = createCorsHandler(handler);
        corsHandler({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            expect(res.statusCode).toEqual(302);
            expect(res.body).toEqual('Redirect to: loc');
            expect(res.headers['Access-Control-Allow-Origin']).toEqual('*')
            expect(res.headers['Access-Control-Allow-Credentials']).toEqual(true)
            expect(res.headers['Location']).toEqual("loc")
            done();
        })
    })

    test('ok', (done) => {
        const handler = {
            handle: (event,context,cb) => {
                cb(null,{good: "data"});
                return;
            }
        }
        const corsHandler = createCorsHandler(handler);
        corsHandler({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual('{\"good\":\"data\"}');
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
        const corsHandler = createCorsHandler(handler);
        corsHandler({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual('"bad"');
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
        const corsHandler = createCorsHandler(handler);
        corsHandler({},{},(err,res)=>{
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual('"bad"');
            expect(res.headers['Access-Control-Allow-Origin']).toEqual('*')
            expect(res.headers['Access-Control-Allow-Credentials']).toEqual(true)
            done();
        })
    })

});

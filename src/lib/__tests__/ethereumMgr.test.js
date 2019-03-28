const sutMgr = require('../ethereumMgr');

describe('EthereumMgr', () => {
    
    let sut;
    const seed = "kitten lemon sea enhance poem grid calm battle never summer night express";
  

    beforeAll(() =>{
        sut = new sutMgr();
    })

    test("empty constructor", () => {
        expect(sut).not.toBeUndefined();
        expect(sut.pgUrl).toBeNull();
        expect(sut.seed).toBeNull();
        expect(sut.eths).toEqual({});
        expect(sut.gasPrices).toEqual({});
    });
    
    test("is isSecretsSet", () => {
        let secretSet = sut.isSecretsSet();
        expect(secretSet).toEqual(false);
    });

    test("setSecrets", () => {
        expect(sut.isSecretsSet()).toEqual(false);
        sut.setSecrets({ PG_URL: "fake", SEED: seed });
        expect(sut.isSecretsSet()).toEqual(true);
        expect(sut.pgUrl).not.toBeUndefined();
        expect(sut.seed).not.toBeUndefined();
        expect(sut.eths).not.toBeUndefined();
        expect(sut.gasPrices).not.toBeUndefined();
        expect(sut.addresses).not.toBeUndefined();
        expect(sut.addresses.length).toEqual(5);
      });

    //no pgUrl here


    describe("getBalance()", () => {
        test("no networkId", done => {
            sut
              .getBalance(null,"0xaddress")
              .then(resp => {
                fail("shouldn't return");
                done();
              })
              .catch(err => {
                expect(err.message).toEqual("no networkId");
                done();
              });
          });

        test("no address", done => {
          sut
            .getBalance("0x4",null)
            .then(resp => {
              fail("shouldn't return");
              done();
            })
            .catch(err => {
              expect(err.message).toEqual("no address");
              done();
            });
        });
    
        test("no eth for networkId", done => {
          sut
            .getBalance("bad", "0xaddress")
            .then(resp => {
              fail("shouldn't return");
              done();
            })
            .catch(err => {
              expect(err).toEqual("no eth for networkId");
              done();
            });
        });
    
        test("happy path", done => {
          sut.eths["0x0"] = {
            getBalance: jest.fn().mockReturnValueOnce(10)
          };
          sut.getBalance("0x0", "0xaddress").then(resp => {
            expect(sut.eths["0x0"].getBalance).toBeCalledWith("0xaddress");
            expect(resp).toEqual("10")
            done();
          });
        });
    });
    
    describe("getGasPrice()", () => {
        test("no networkId", done => {
            sut
              .getGasPrice(null,)
              .then(resp => {
                fail("shouldn't return");
                done();
              })
              .catch(err => {
                expect(err.message).toEqual("no networkId");
                done();
              });
          });

        test("no eth for networkId", done => {
          sut
            .getGasPrice("bad")
            .then(resp => {
              fail("shouldn't return");
              done();
            })
            .catch(err => {
              expect(err.message).toEqual("no eth for networkId");
              done();
            });
        });

        test("fail on gasPrice()", done => {
            sut.eths["0x0"] = {
              gasPrice: jest.fn().mockImplementationOnce( () => {throw ("fail")})
            };
            sut.gasPrices["0x0"]=1000000000;
            sut.getGasPrice("0x0").then(resp => {
              expect(sut.eths["0x0"].gasPrice).toBeCalled();
              expect(resp).toEqual(1000000000)
              done();
            });
          });
    
        test("happy path (less than min)", done => {
          sut.eths["0x0"] = {
            gasPrice: jest.fn().mockResolvedValueOnce({toNumber: ()=>{return 1000}})
          };
          sut.getGasPrice("0x0").then(resp => {
            expect(sut.eths["0x0"].gasPrice).toBeCalled();
            expect(resp).toEqual(1000000000)
            done();
          });
        });

        test("happy path (more than min)", done => {
            sut.eths["0x0"] = {
              gasPrice: jest.fn().mockResolvedValueOnce({toNumber: ()=>{return 1000000001}})
            };
            sut.getGasPrice("0x0").then(resp => {
              expect(sut.eths["0x0"].gasPrice).toBeCalled();
              expect(resp).toEqual(1000000001)
              done();
            });
          });
    });

    describe("getContract()", () => {
      test("no networkId", done => {
          sut
            .getContract(null)
            .then(resp => {
              fail("shouldn't return");
              done();
            })
            .catch(err => {
              expect(err.message).toEqual("no networkId");
              done();
            });
        });
        test("no abi", done => {
          sut
            .getContract("0x4",null)
            .then(resp => {
              fail("shouldn't return");
              done();
            })
            .catch(err => {
              expect(err.message).toEqual("no abi");
              done();
            });
        });

      test("no eth for networkId", done => {
        sut
          .getContract("bad",[])
          .then(resp => {
            fail("shouldn't return");
            done();
          })
          .catch(err => {
            expect(err.message).toEqual("no eth for networkId");
            done();
          });
      });

      test("happy path", done => {
        sut.getContract("4",[]).then(resp => {
          expect(resp).not.toBeNull()
          done();
        });
      });

    });

});

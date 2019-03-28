const sutMgr = require('../sensuiVaultMgr');

describe('SensuiVaultMgr', () => {
    
    let sut;

    beforeAll(() =>{
        sut = new sutMgr();
    })

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
    });

});

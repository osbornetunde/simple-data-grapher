const assert = require('chai').assert;
const sampleTest = require('../../src/sample').sampleTest;

describe("Sample Test", function(){
    it('Should return Mocha Testing', function () {
        var result = sampleTest();
        assert.equal(result, "Mocha Testing");
    });
});
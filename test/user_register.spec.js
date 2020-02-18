var should = require("should");
var request = require("request");
var chai = require("chai");
var expect = chai.expect;
var urlBase = "http://localhost:3000/";


describe("Find PSID",function(){
  it("Deve retornar psid 1",function(done){
    request.get(
      {
        url : urlBase + "t"
      },
      function(error, response, body){
        // precisamos converter o retorno para um objeto json
        var _body = {};
        try{
          _body = JSON.parse(body);
        }
        catch(e){
          _body = {};
        }
          
        expect(_body.card).to.equal('card');

        done(); // avisamos o test runner que acabamos a validacao e ja pode proseeguir
      }
    );
  }); 
});





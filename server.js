//Config Express
var PORT = process.env.PORT || 3000;
require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var request = require('request');
var fs = require('fs');
var http = require('http');
const https = require('https');
var str_con = process.env.STR_CON;

// DB poll config
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || str_con,
  ssl: true
});

//App init
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.set('view engine', 'ejs');

app.use('/static', express.static('public'));

// for Facebook verification
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'trelabs_sj') {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
});

function getPSID(req) {
  let msg = req.body.entry[0].messaging[0];
  let psid = msg.sender.id;
  return psid;
}

async function getContext(psid) {
  try {
    let cliente = await pool.connect();
    let resultado = await cliente.query("select contexto from usuario where psid='"+psid+"'");
    console.log(resultado.rows[0].contexto);
    console.log(psid);
    return resultado.rows[0].contexto;
  } catch (e) {
    console.log(e);
    return [];
  }
}

var token = "EAAYxzACKqZAsBAJcnacHvK0Yg7DZA20gsFyKjcaV7cpS1NZBX300oXsGNvYXPjJTYTjVIhSi6tNn9byyicNdgp8G4WxHapt6JE56o8udTtWZAKY6Amr1ayDVwTnDfvcRqSvXS25EEMC5KefMaijOZBouyEnuGcdvIZALRX8K18xtSJqx8dv9zM";

// function to echo back messages - added by Stefan

function sendTextMessage(sender, text) {
  messageData = {
    text: text
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: {
      recipient: { id: sender },
      message: messageData,
    }
  }, function (error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

app.get('/', function (req, res) {
  res.render('pages/index');
});

async function get_psid(req){
  event = req.body.entry[0].messaging[0]
  sender = event.sender.id
  return sender;
}

async function cadastrar_usuario(psid){
  try {
    pool.connect((err, client, release) => {
      if (err) {
        return console.error('Error acquiring client', err.stack)
      }
      client.query("insert into public.usuario (psid, contexto) values ('"+psid+"','cadastro')", (err, result) => {
      return "usuario_cadatrado_com_sucesso";
        release()
        if (err) {
          return console.error('Error executing query', err.stack)
          console.log(" # Deu erro porque veio vazio #");
        }
        console.log(" # O resultado pode estar vazio #");
        console.log(result.rows)
      })
    })
  } catch (e) {
    console.log(e);
  }
}

async function muda_context_usuario(psid, contexto){
  try {
    pool.connect((err, client, release) => {
      if (err) {
        return console.error('Error acquiring client', err.stack)
      }
      let r = client.query("UPDATE public.usuario SET contexto = "+contexto+" WHERE psid='"+psid+"'", (err, result) => {
      console.log("#update context"+r);
        return "usuario_cadatrado_com_sucesso";
        release()
        if (err) {
          return console.error('Error executing query', err.stack)
          console.log(" # Deu erro porque veio vazio #");
        }
        console.log(" # O resultado pode estar vazio #");
        console.log(result.rows)
      })
    })
  } catch (e) {
    console.log(e);
  }
}

async function salva_nome(psid, nome){
  try {
    pool.connect((err, client, release) => {
      if (err) {
        return console.error('Error acquiring client', err.stack)
      }
      client.query("UPDATE public.usuario SET nome = '"+nome+"' WHERE psid= '"+psid+"'", (err, result) => {
      return "nome_salvo_com_sucesso";
        release()
        if (err) {
          return console.error('Error executing query', err.stack)
          console.log(" # Deu erro porque veio vazio #");
        }
        console.log(" # O resultado pode estar vazio #");
        console.log(result.rows)
      })
    })
  } catch (e) {
    console.log(e);
  }
}

async function convert_name_to_oracle(param){
  param = param.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  param = param.toUpperCase();
  param = param.split(' ').join('+');
  console.log("# nome_upper:"+param);
  return param;
}

async function convert_date_to_oracle(param){
  param = param.substring(0, param.length-15);
  param = param.split('-').join('');
  console.log("# date_oracle:"+param);
  return param;
}

app.post('/situacao', (req, res) => {
  const eleitor_nome = req.body.queryResult.parameters.nome;
  console.log("nome_param "+eleitor_nome);     

  const eleitor_nome_mae = req.body.queryResult.parameters.nome_mae;
  console.log("nome_mae_param "+eleitor_nome_mae);  
  
  const eleitor_data_nasc = req.body.queryResult.parameters.data_nasc;
  console.log("eleitor_data_nasc "+eleitor_data_nasc); 
    
  let nome_converted = convert_name_to_oracle(eleitor_nome);
  let nome_mae_converted = convert_name_to_oracle(eleitor_nome_mae);
  let data_nasc_converted = convert_date_to_oracle(eleitor_data_nasc);

	const reqUrl = encodeURI(
		`https://botsociedade.tre-rn.jus.br/api/situacao?nome=${eleitor_nome}&mae=${eleitor_nome_mae}&nascimento={eleitor_data_nasc}`
	)
	https.get(
		reqUrl,
		responseFromAPI => {
     console.log("#urlr:"+eqUrl);

			let completeResponse = ''
			responseFromAPI.on('data', chunk => {
        completeResponse += chunk
        console.log("#chunk: "+chunk);
 			})
			responseFromAPI.on('end', () => {
        const c_response =  JSON.parse(completeResponse)
        console.log("# complete response:"+c_response);

				let dataToSend = `Situacao`;

				return res.json({
					fulfillmentText: dataToSend,
					source: 'api'
				})
			})
		},
		error => {
			return res.json({
				fulfillmentText: 'Could not get results at this time',
				source: 'api'
			})
		}
	)
})

app.post('/webhook/', async function (req, res) {
  messaging_events = req.body.entry[0].messaging
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i]
    sender = event.sender.id
    if (event.message && event.message.text) {
      text = event.message.text
    }
    if (event.postback) {
      text = JSON.stringify(event.postback)
      sendTextMessage(sender, "Postback received: " + text.substring(0, 200), token)
      continue
    }
  }
  res.sendStatus(200)
});

function sleep(ms) {
  return new Promise((resolve) => {
      setTimeout(resolve, ms);
  });
}  

//Porta padrão da aplicação
app.listen(PORT, function () {
  console.log('Second server listening on port 3000!');
});
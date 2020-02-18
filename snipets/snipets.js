//async await 
app.get('/teste/getcontext', async function (req, res) {
    let psid = req.query.psid;
    console.log("param " + psid);
    let out = await getContext(psid);
    if(out==[]){
  
    }
    console.log("### OUT ###: " + out);
  
    res.send(out);
  });

// API End Point 
app.post('/webhook-off/', function (req, res) {
    console.log("##########################");
    console.log("Entrou no webhook");
    console.log("##########################");
    let opsid = getPSID(req);
    console.log(opsid);
    console.log(getContext(opsid));

    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        psid = event.sender.id;
        console.log("# deu certo #");
        if (event.message && event.message.text) {
            text = event.message.text
            console.log(text);
            if (text == "Iniciar acompanhamento" || text == "cd") {
                sendTextMessage(sender, "Ok, primeiro preciso fazer o seu cadastro");
                sendTextMessage(sender, "Qual o seu nome?");
                let contexto = setContext("cadastro_nome");
                sendTextMessage(sender, contexto);
            }
        }
        if (event.postback) {
            text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback received: " + text.substring(0, 200), token)
            continue
        }
    }
    res.sendStatus(200)
});


app.post("/webhook_select_intent", function (req, res) {
    var intent_name = req.body.queryResult.intent.displayName;
    var speech = "";
    if (intent_name == "echo") {
        speech = "echo";
    } else if (intent_name == "T004-webhook1") {
        speech = "T004-webhook1";
    } else if (intent_name == "T005-hook") {
        speech = "T005-hook";
    } else {
        speech = "Erro webhook!"
    }

    var speechResponse = {
        google: {
            expectUserResponse: true,
            richResponse: {
                items: [
                    {
                        simpleResponse: {
                            textToSpeech: speech
                        }
                    }
                ]
            }
        }
    };

    return res.json({
        payload: speechResponse,
        //data: speechResponse,
        fulfillmentText: speech,
        speech: speech,
        displayText: speech,
        source: "webhook-echo-sample"
    });
});


//parâmetro e status code 200
app.get('/find_psid/:psid', function (req, res) {
    console.log("aew");
    res.status('200').send({ card: 'card' });
});


//teste db select banco de dados new table usuario
app.get('/db_teste', (req, res) => {
    try {
        pool.connect((err, client, release) => {
            if (err) {
                return console.error('Error acquiring client', err.stack)
            }
            result = client.query('select * from usuario', (err, result) => {
                release()
                if (err) {
                    return console.error('Error executing query', err.stack)
                }
                console.log(result.rows)
            })
        });
        res.send("funcionou!");
    }
    catch (e) {
        console.log(e);
    }
});

// teste db
app.get('/heroku_db', (req, res) => {
    let saida = "";
    client.connect();
    try {
        client.query('select * from teste_table', (err, res) => {
            if (err) throw err;
            saida = res.rows;
            for (let row of res.rows) {
                console.log(JSON.stringify(row));
            }
            client.end();
        });
    }
    catch (e) {
        console.log(e);
    }
    res.send("string");
});

//version
app.get('/version', (req, res) => {
    return res.send('21');
});

//sleep
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

//usando função sleep
await sleep(1000);
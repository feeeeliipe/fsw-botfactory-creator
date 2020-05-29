const express = require('express');
const xlsx = require('node-xlsx');
const axios = require('axios');

const router = express.Router();

function handleFile(data, botId, parent) {
    let position = 1;
    let subject;
    let lastIdentifier;
    let subjects = [];

    for (let index = 1; index < data.length; index++) {
        const line = data[index];
        const identifier = line[0];
        const question = line[1];
        const answer = line[2];

        // Se o identificador do assunto for diferente, cria um novo
        if(identifier != lastIdentifier) {
            subject = createBotFactorySubject(identifier, position, answer, botId, parent);
            // Adiciona a pergunta ao assunto
            addQuestionToSubject(subject, question);
            position++;
        } else if(subject) {
            // Adiciona a pergunta ao assunto
            addQuestionToSubject(subject, question);
            subjects.push(subject);
        }

        lastIdentifier = identifier;
    }    

    return subjects;
}

function createBotFactorySubject(identifier, position, answer, botId, parent) {
    const subject = {
        botId: botId,
        parent: parent,
        position: position,
        type: "INTENT",
        name: `QUESTION${identifier}`, 
        output: [ {
            type: "HTML", 
            text: [ `<p>${answer}</p>` ]
        }], 
        examples: []
    }
    return subject;
}

function addQuestionToSubject(subject, question) {
    subject.examples.push(question);
}

function sendToServer(subjects, platformUrl, platformToken) {
    
    const url = `${platformUrl}/t/senior.com.br/bridge/1.0/rest/platform/botfactory/actions/saveNode`;
    
    for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];
        
        axios.post(url, subject, { headers: { Authorization: platformToken } }).then(res => {
            console.log('Assunto criado com sucesso');
        },
        error => {
            console.log(error);
        });

    }
}

router.post('/createFaqBot', async(req, res) => {
    
    if(req.body == undefined) {
        return res.status(400).send({ error: 'Body is required' });
    }
    
    const { botId, parent, filePath, platformUrl, platformToken } = req.body;
    if(!botId) {
        return res.status(400).send('Bot id not provided.');
    }
    if(!parent) {
        return res.status(400).send('Parent id not provided.');
    }
    if(!filePath) {
        return res.status(400).send('File path not provided.');
    }
    if(!platformUrl) {
        return res.status(400).send('Platform base url not provided.');
    }
    if(!platformToken) {
        return res.status(400).send('Platform token not provided.');
    }

    const file = xlsx.parse(filePath);
    const subjects = await handleFile(file[0].data, botId, parent);
    sendToServer(subjects, platformUrl, platformToken);

    return res.send( { message: 'Deu boa'} );
});

module.exports = app => {
    app.use('/', router);
}
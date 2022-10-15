const express = require('express');
const app = express();
const {v4: uuidv4} = require("uuid");

app.use(express.json()); //necessario para receber json
// criar dados = post
const customers = [];
//Middlewares
function VerifyExistAccountCPF(request,response,next) { // função verifica se o cpf já existe
    const {cpf} = request.headers;
   const customer = customers.find(
    customer => customer.cpf == cpf
    ); // procurando algum cpf igual
    
    if (!customer) {
        return response.status(400).json({error: "Customer not found!"});
    };
    request.customer = customer //????
    return next(); //prossegue
}
function getBalance(statement) {
    const balance = statement.reduce((acc,operetion) => {
        if (operetion.type == 'credit') {
            return acc + operetion.amount; //somando caso seja credit
        }
        else{
            return acc - operetion.amount; //reduzindo caso seja debit
        }
    },0);
    return balance;
}
// se eu quiser usar a função em uma longa sequencia de codigo = app.use(verifyExistAccountCPF)
app.post('/account', (request, response) => {
    const {cpf , name}  = request.body; //desestruturaçao
    const cpfEquals = customers.some(
        (customer) => customer.cpf === cpf
        ); // verificando se o cpf é igual
        // some - existe ou não (retorna boolean)
    if (cpfEquals) {
        return response.status(400).json({error: "CPF already exist!"});

    }
    const id = uuidv4();
    // objeto
    customers.push({
        cpf,
        name,
        id,
        statement:[] // array vazio
    });
    return response.status(201).send(); //codigo 201 = dados criados
});

// Pesquisar extrato bancario
app.get('/statement/' ,VerifyExistAccountCPF, (request , response)=>{
    const {customer} = request; //?
    return response.json(customer.statement);
});

app.post('/deposit' ,VerifyExistAccountCPF, (request , response)=>{

   const { description, amount} = request.body
   const {customer} = request;
   const statementOperetion = {
    description,
    amount,
    created_at: new Date(),
    type : "credit"
   }
   customer.statement.push(statementOperetion); // puxar para o custumer os valores
   return response.status(201).send();
});

//saque
app.post('/withdraw',VerifyExistAccountCPF, (request, response)=>{

   const { amount} = request.body
    const {customer} = request;
    const balance = getBalance(customer.statement);
    console.log(balance);
    // verify if balance is positive
    if (balance < amount || balance === 0) {
        return response.status(400).json({error: "Not enough balance"});
    }
    const statementOperetion = {
            amount,
            created_at: new Date(),
            type : "debit"
    };
    customer.statement.push(statementOperetion); // puxar o valor do balanço
   return response.status(201).send();
});
// Listar extrato bancario por data
app.get('/statement/date' ,VerifyExistAccountCPF, (request , response)=>{
    const {customer} = request; //?
    const {date} = request.query
    const dateFormat = new Date(date + " 00:00");
    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() ===
    new Date(dateFormat).toDateString());

    return response.json(customer.statement);
});

// Atualizar dados do custumer

app.put("/account",VerifyExistAccountCPF,(request,response)=>{
    const {name} = request.body; // requisitando o nome atualizado
    const {customer} = request; // problemas com o custumer
    //console.log(customer.name);
    customer.name = name; // substituindo o nome antigo
    return response.status(201).send();
});

//dadps da conta
app.get('/account',VerifyExistAccountCPF, (request , response)=>{
    const {customer} = request;
    return response.json(customer);
});
// Delete account
app.delete('/account',VerifyExistAccountCPF, (request, response)=>{
    const {customer} = request;
    //splice
    customers.splice(customer,1); // remove o cliente
    return response.status(200).json(customers); 
});
app.get("/balance",VerifyExistAccountCPF,(request , response)=>
{
    const {customer} = request;
    const balance = getBalance(customer.statement);
    return response.json(balance).status(201);
});
app.listen(3000);

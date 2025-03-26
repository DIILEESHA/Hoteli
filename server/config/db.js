const { default: mongoose } = require('mongoose');
mongoose.set('strictQuery', true);

const mongoURL = `mongodb+srv://dlx:dlx@cluster0.nzxlb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

mongoose.connect(mongoURL);

var connection = mongoose.connection;

connection.on('error', ()=> {
    console.log('MongDB Connection Failed')
})

connection.on('connected' , ()=>{
    console.log('MongoDB Connection Successful')
})

module.exports = mongoose;
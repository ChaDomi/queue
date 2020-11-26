var {app} = require('./app.js');
const port= process.env.PORT || 3000
var server = app.listen(port, function () {

    console.log('Web App Hosted at http://localhost:%s',port);

});

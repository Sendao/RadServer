
module.exports = function TestingObject(app, fw)
{
    this.run = function() {
    	var dx = app.data.marky;
    	
    	var nexts = dx.formatMarky("In a world where a person lives");
    	var words = [ 'in', 'a', 'world', 'where', 'person', 'lives' ];
    	var i;
    	
    	for(i=0;i<words.length;++i){
    		fw.assert( (words[i] in nexts), words[i] + " in nexts");
    	}
    };
};


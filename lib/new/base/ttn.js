module.exports = function TTNDB(Database) {
    var db = Database;
    Database.control.call(this, 'ttn');
    console.log("TTN database created");
    
    this.Messages = function() {
        this.name = 'messages';
        this.primary = "id";
        this.unique = ['id'];
        this.indice = { "time": {}, "id": {} };
        this.defaults = { 'devEUI': '', 'time': 0, 'xfields': '',
        		'frequency': 0,
        		'id': 0,
        		'datarate': '',
        		'coding': '0/5',
        		'gateway_timestamp': 0,
        		'channel': 0,
        		'server_time': '',
        		'rssi': 0,
        		'lsnr': 0,
        		'rfchain': 0,
        		'crc': 0,
        		'modulation': '',
        		'gateway_eui': '',
        		'altitude': 0,
        		'longitude': 0,
        		'latitude': 0
        };
        db.convey.call(this, 'ttn');
        console.log("Messages table initialized");
    };
    
    this.messages = new this.Messages();
};

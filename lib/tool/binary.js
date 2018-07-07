
function BinaryObject(app) {
	
	// https://stackoverflow.com/questions/9939760/how-do-i-convert-an-integer-to-binary-in-javascript

	this.flt64 = new Float64Array(1)
	this.uint16 = new Uint16Array(flt64.buffer)
	this.MAX_SAFE = 9007199254740991; // 2**53-1
	this.MAX_INT32 = 2147483648; // 2**31
	
	this.uint16ToBinary = function() {
		var bin64 = '';

	    for (var word = 0; word < 4; word++) {
	      bin64 = uint16[word].toString(2).padStart(16, 0) + bin64
	    }
	    
	    return bin64;
	};
	
	this.float64ToInt64Binary = function(number) {
	    // NaN would pass through Math.abs(number) > MAX_SAFE
		if (!(Math.abs(number) <= MAX_SAFE))
			return null;
		
		var sign = number < 0 ? 1 : 0
		// shortcut for sufficiently small range
		if (Math.abs(number) <= MAX_INT32) {
			return (number >>> 0).toString(2).padStart(64, sign)
		}

		// little endian byte ordering
		flt64[0] = number
		// subtract bias from exponent bits
		var exponent = ((uint16[3] & 0x7FF0) >> 4) - 1023

		// encode implicit leading bit of mantissa
		uint16[3] |= 0x10
		// clear exponent and sign bit
		uint16[3] &= 0x1F

		// check sign bit
		if (sign === 1) {
		// apply two's complement
			uint16[0] ^= 0xFFFF
			uint16[1] ^= 0xFFFF
			uint16[2] ^= 0xFFFF
			uint16[3] ^= 0xFFFF
				// propagate carry bit
			for (var word = 0; word < 3 && uint16[word] === 0xFFFF; word++) {
					// apply integer overflow
				uint16[word] = 0
			}

			// complete increment
			uint16[word]++
		}
		var bin64 = uint16ToBinary().substr(11, Math.max(exponent, 0))
		// sign-extend binary string
		return bin64.padStart(64, sign)
	};
};

// only keep integer part of mantissa

console.log('8')
console.log(float64ToInt64Binary(8))
console.log('-8')
console.log(float64ToInt64Binary(-8))
console.log('2**33-1')
console.log(float64ToInt64Binary(2**33-1))
console.log('-(2**33-1)')
console.log(float64ToInt64Binary(-(2**33-1)))
console.log('2**53-1')
console.log(float64ToInt64Binary(2**53-1))
console.log('-(2**53-1)')
console.log(float64ToInt64Binary(-(2**53-1)))
console.log('2**52')
console.log(float64ToInt64Binary(2**52))
console.log('-(2**52)')
console.log(float64ToInt64Binary(-(2**52)))
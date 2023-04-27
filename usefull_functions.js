function switch_layout(str) {
	let compl_str = '';
	str.split('').forEach(function(c){
		const keys   = 'QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮqwertyuiop[]asdfghjkl;\'zxcvbnm,.йцукенгшщзхъфывапролджэячсмитьбю'.split('');
		const values = 'ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮQWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>йцукенгшщзхъфывапролджэячсмитьбюqwertyuiop[]asdfghjkl;\'zxcvbnm,.'.split('');
		let switchMap = new Map();
		for (let i=0;i<keys.length;i++) switchMap.set(keys[i],values[i]);
		compl_str += switchMap.get(c)==undefined ? c : switchMap.get(c);
	});
	return compl_str;
} 

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

function removeByValue(arr,filterValue){
    return arr.filter(function(value){return value!=filterValue})
}

module.exports.switch_layout = switch_layout
module.exports.sleep = sleep
module.exports.removeByValue = removeByValue
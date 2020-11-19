function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function transliterate(word){
    var answer = ""
        , a = {};

    a["Ё"]="YO";a["Й"]="I";a["Ц"]="TS";a["У"]="U";a["К"]="K";a["Е"]="E";a["Н"]="N";a["Г"]="G";a["Ш"]="SH";a["Щ"]="SCH";a["З"]="Z";a["Х"]="H";a["Ъ"]="'";
    a["ё"]="yo";a["й"]="i";a["ц"]="ts";a["у"]="u";a["к"]="k";a["е"]="e";a["н"]="n";a["г"]="g";a["ш"]="sh";a["щ"]="sch";a["з"]="z";a["х"]="h";a["ъ"]="'";
    a["Ф"]="F";a["Ы"]="I";a["В"]="V";a["А"]="a";a["П"]="P";a["Р"]="R";a["О"]="O";a["Л"]="L";a["Д"]="D";a["Ж"]="ZH";a["Э"]="E";
    a["ф"]="f";a["ы"]="i";a["в"]="v";a["а"]="a";a["п"]="p";a["р"]="r";a["о"]="o";a["л"]="l";a["д"]="d";a["ж"]="zh";a["э"]="e";
    a["Я"]="Ya";a["Ч"]="CH";a["С"]="S";a["М"]="M";a["И"]="I";a["Т"]="T";a["Ь"]="'";a["Б"]="B";a["Ю"]="YU";
    a["я"]="ya";a["ч"]="ch";a["с"]="s";a["м"]="m";a["и"]="i";a["т"]="t";a["ь"]="'";a["б"]="b";a["ю"]="yu";
    a["І"] = "I";a['і'] = "i";a["Ї"] = "JI";a["ї"] = "ji";a["Є"] = "e";a["є"] = "e";

    for (i in word){
        if (word.hasOwnProperty(i)) {
            if (a[word[i]] === undefined){
                answer += word[i];
            } else {
                answer += a[word[i]];
            }
        }
    }
    return answer;
}

function initLiqpayCall(value,name,email,subscription) {
    console.log(subscription);
    var public_key = 'i27357705397';
    var private_key = 'chWzY6P4DCi94NDVngzJ9teTCKy0qlLyZhsu4fWv';
    var html = {
        'public_key'     : 'i27357705397',
        'action'         : 'pay',
        'sender_first_name' : transliterate(name) + ' / ' + email,
        'amount'         : value,
        'currency'       : 'UAH',
        'description'    : 'Your donation amount. thank\'s for supporting us!',
        'order_id'       : base64_encode(getRandomArbitrary(0,1000000) + ' ' +Date.now()),
        'version'        : '3'
    };
    var dataArr = [];
    var json = JSON.stringify(html);
    dataArr['data'] = base64_encode(json);
    var str = private_key + dataArr['data'] + private_key;
    dataArr['signature'] = b64_sha1(str) + '=';
    return dataArr;
}function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function transliterate(word){
    var answer = ""
        , a = {};

    a["Ё"]="YO";a["Й"]="I";a["Ц"]="TS";a["У"]="U";a["К"]="K";a["Е"]="E";a["Н"]="N";a["Г"]="G";a["Ш"]="SH";a["Щ"]="SCH";a["З"]="Z";a["Х"]="H";a["Ъ"]="'";
    a["ё"]="yo";a["й"]="i";a["ц"]="ts";a["у"]="u";a["к"]="k";a["е"]="e";a["н"]="n";a["г"]="g";a["ш"]="sh";a["щ"]="sch";a["з"]="z";a["х"]="h";a["ъ"]="'";
    a["Ф"]="F";a["Ы"]="I";a["В"]="V";a["А"]="a";a["П"]="P";a["Р"]="R";a["О"]="O";a["Л"]="L";a["Д"]="D";a["Ж"]="ZH";a["Э"]="E";
    a["ф"]="f";a["ы"]="i";a["в"]="v";a["а"]="a";a["п"]="p";a["р"]="r";a["о"]="o";a["л"]="l";a["д"]="d";a["ж"]="zh";a["э"]="e";
    a["Я"]="Ya";a["Ч"]="CH";a["С"]="S";a["М"]="M";a["И"]="I";a["Т"]="T";a["Ь"]="'";a["Б"]="B";a["Ю"]="YU";
    a["я"]="ya";a["ч"]="ch";a["с"]="s";a["м"]="m";a["и"]="i";a["т"]="t";a["ь"]="'";a["б"]="b";a["ю"]="yu";
    a["І"] = "I";a['і'] = "i";a["Ї"] = "JI";a["ї"] = "ji";a["Є"] = "e";a["є"] = "e";

    for (i in word){
        if (word.hasOwnProperty(i)) {
            if (a[word[i]] === undefined){
                answer += word[i];
            } else {
                answer += a[word[i]];
            }
        }
    }
    return answer;
}

function initLiqpayCall(value,name,email,subscription) {
    console.log(subscription);
    var public_key = 'i27357705397';
    var private_key = 'chWzY6P4DCi94NDVngzJ9teTCKy0qlLyZhsu4fWv';
    var html = {
        'public_key'     : 'i27357705397',
        'action'         : 'pay',
        'sender_first_name' : transliterate(name) + ' / ' + email,
        'amount'         : value,
        'currency'       : 'UAH',
        'description'    : 'Your donation amount. thank\'s for supporting us!',
        'order_id'       : base64_encode(getRandomArbitrary(0,1000000) + ' ' +Date.now()),
        'version'        : '3'
    };
    var dataArr = [];
    var json = JSON.stringify(html);
    dataArr['data'] = base64_encode(json);
    var str = private_key + dataArr['data'] + private_key;
    dataArr['signature'] = b64_sha1(str) + '=';
    return dataArr;
}
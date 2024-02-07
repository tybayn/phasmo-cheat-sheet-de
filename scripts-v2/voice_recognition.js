const levenshtein_distance = (str1 = '', str2 = '') => {
    const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
       track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
       track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
       for (let i = 1; i <= str1.length; i += 1) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          track[j][i] = Math.min(
             track[j][i - 1] + 1,
             track[j - 1][i] + 1,
             track[j - 1][i - 1] + indicator,
          );
       }
    }
    return track[str2.length][str1.length];
 };

 let running_log = []

 $.fn.isInViewport = function () {
    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();
  
    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + window.innerHeight;
  
    return elementBottom > viewportTop && elementTop < viewportBottom;
}

function reset_voice_status(){
    setTimeout(function(){
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
        document.getElementById("voice_recognition_status").className = "pulse_animation"
    },1000)
}

function domovoi_show_last(){
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
}

function domovoi_hide_last(){
    $("#domovoi-text").hide()
    $("#domovoi-img").attr("src","imgs/domovoi.png")
}


function domovoi_heard(message){
    $("#domovoi-text").text(message.toLowerCase())
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
    setTimeout(function() {
        $("#domovoi-text").hide()
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },2000)
}

function domovoi_not_heard(){
    $("#domovoi-img").attr("src",user_settings['domo_side'] == 1 ? "imgs/domovoi-guess-flip.png" : "imgs/domovoi-guess.png")
    setTimeout(function() {
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },3000)
}

function domovoi_print_logs(){
    console.log("----------------------------------------------------------------")
    console.log("Domo memory:")
    running_log.forEach(function (item,idx){
        console.log(`--${idx}--`)
        for (const [key, value] of Object.entries(item)) {
            console.log(`${key}: ${value}`)
        }
    })
    console.log("----------------------------------------------------------------")
}

function parse_speech(vtext){
    vtext = vtext.toLowerCase().trim()
    running_log.push({
        "Time":new Date().toJSON().replace('T', ' ').split('.')[0],
        "Raw":vtext
    })
    if(running_log.length > 5){
        running_log.shift()
    }
    let cur_idx = running_log.length - 1

    domovoi_msg = ""

    for (const [key, value] of Object.entries(ZNLANG['overall'])) {
        for (var i = 0; i < value.length; i++) {
            vtext = vtext.replace(value[i], key);
        }
    }

    running_log[cur_idx]["Cleaned"] = vtext

    if(vtext.startsWith('geistergeschwindigkeit')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized geistergeschwindigkeit command")
        running_log[cur_idx]["Type"] = "geistergeschwindigkeit"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('geistergeschwindigkeit', "").trim()
        domovoi_msg += "markierte geistergeschwindigkeit als "

        vtext = vtext.replace('drei','3')
        vtext = vtext.replace('zwei','2')
        vtext = vtext.replace('eins','1')
        vtext = vtext.replace('null','0')

        var smallest_num = '150'
        var smallest_val = 100
        var prev_value = document.getElementById("ghost_modifier_speed").value
        var all_ghost_speed = ['50','75','100','125','150']
        var all_ghost_speed_convert = {'50':0,'75':1,'100':2,'125':3,'150':4}

        for(var i = 0; i < all_ghost_speed.length; i++){
            var leven_val = levenshtein_distance(all_ghost_speed[i],vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_num = all_ghost_speed[i]
            }
        }
        domovoi_msg += smallest_num

        document.getElementById("ghost_modifier_speed").value = all_ghost_speed_convert[smallest_num] ?? 2

        if(prev_value != all_ghost_speed_convert[smallest_num]){
            setTempo();
            bpm_calc(true);
            saveSettings();
            send_state()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('geist')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized geist command")
        running_log[cur_idx]["Type"] = "geist"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('geist', "").trim()
        domovoi_msg += "markierte "

        var smallest_ghost = "Spirit"
        var smallest_val = 100
        var vvalue = 0
        if(vtext.startsWith("nicht ")){
            vtext = vtext.replace('nicht ', "").trim()
            vvalue = 0
            domovoi_msg += "nicht "
        }
        else if(vtext.startsWith("klar ") || vtext.startsWith("löschen")){
            vtext = vtext.replace('klar ', "").replace("löschen ","").trim()
            vvalue = 0
            domovoi_msg = "gelöscht "
        }
        else if(vtext.startsWith("erraten ")){
            vtext = vtext.replace('erraten ', "").trim()
            vvalue = 3
            domovoi_msg = "erratener "
        }
        else if(vtext.startsWith("wählen ")){
            vtext = vtext.replace('wählen ', "").trim()
            vvalue = 2
            domovoi_msg = "ausgewählter "
        }
        else if(vtext.startsWith("abwählen ")){
            vtext = vtext.replace('abwählen ', "").trim()
            vvalue = 2
            domovoi_msg = "abgewählter "
        }
        else if(vtext.startsWith("verbergen ") || vtext.startsWith("entfernen ")){
            vtext = vtext.replace('verbergen ', "").replace('entfernen ', "").trim()
            vvalue = -1
            domovoi_msg = "entfernt "
        }
        else if(vtext.endsWith(" getötet")){
            vtext = vtext.replace('von einem ', "").replace(' getötet', "").trim()
            vvalue = -2
            domovoi_msg = "von einem "
        }
        else if(vtext.startsWith("erschau ")){
            vtext = vtext.replace('erschau ', "").trim()
            vvalue = -10
            domovoi_msg = "info für "
        }

        // Common fixes to ghosts
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['ghosts'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_ghosts).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_ghosts)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_ghost = Object.values(all_ghosts)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_ghost}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_ghost}`
        domovoi_msg += smallest_ghost

        if (vvalue == -2){
            domovoi_msg += " getötet"
        }
        else if(vvalue == -10){
            domovoi_msg += " anzeigen"
        }

        if (vvalue == 0){
            fade(document.getElementById(rev(all_ghosts,smallest_ghost)));
        }
        else if (vvalue == 3){
            guess(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == 2){
            select(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == -1){
            remove(document.getElementById(rev(all_ghosts,smallest_ghost)));
        }
        else if (vvalue == -2){
            died(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if(vvalue == -10){
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('beweis')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidence command")
        running_log[cur_idx]["Type"] = "beweis"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('beweis', "").trim()
        domovoi_msg += "beweis als "

        var smallest_evidence = "emf 5"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("nicht ")){
            vtext = vtext.replace('nicht ', "").trim()
            vvalue = -1
            domovoi_msg += "nicht "
        }
        else if(vtext.startsWith("klar ") || vtext.startsWith("löschen")){
            vtext = vtext.replace('klar ', "").replace("löschen ","").trim()
            vvalue = 0
            domovoi_msg = "gelöschte "
        }

        // Common replacements for evidence names
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_evidence).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_evidence)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_evidence = Object.values(all_evidence)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += smallest_evidence

        if (vvalue == -1){
            domovoi_msg += " markiert"
        }

        if(!$(document.getElementById(rev(all_evidence,smallest_evidence)).querySelector("#checkbox")).hasClass("block")){
            while (vvalue != {"good":1,"bad":-1,"neutral":0}[document.getElementById(rev(all_evidence,smallest_evidence)).querySelector("#checkbox").classList[0]]){
                tristate(document.getElementById(rev(all_evidence,smallest_evidence)));
            }
        }
        else{
            domovoi_msg = `Beweise ${smallest_evidence} sind gesperrt!`
        }
        

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('affenpfote')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized affenpfote command")
        running_log[cur_idx]["Type"] = "affenpfote"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('affenpfote', "").trim()
        domovoi_msg += "markierte "

        var smallest_evidence = "emf level 5"
        var smallest_val = 100
        var vvalue = 1

        // Common replacements for evidence names
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_evidence).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_evidence)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_evidence = Object.values(all_evidence)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += `${smallest_evidence} als affenpfotenbeweis`

        monkeyPawFilter($(document.getElementById(rev(all_evidence,smallest_evidence))).parent().find(".monkey-paw-select"))

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('geschwindigkeit')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized geschwindigkeit command")
        running_log[cur_idx]["Type"] = "geschwindigkeit"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('geschwindigkeit', "").trim()
        domovoi_msg += "markierte geschwindigkeit als "

        var smallest_speed = "normal"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("nicht ")){
            vtext = vtext.replace('nicht ', "").trim()
            vvalue = 0
            domovoi_msg += "nicht "
        }
        else if(vtext.startsWith("klar ") || vtext.startsWith("löschen")){
            vtext = vtext.replace('klar ', "").replace("löschen ","").trim()
            vvalue = -1
            domovoi_msg = "gelöscht "
        }

        if (vtext.startsWith("sichtlinie")){
            console.log(`${vtext} >> sichtlinie`)
            running_log[cur_idx]["Debug"] = `${vtext} >> sichtlinie`

            if((vvalue==0 && all_los()) || (vvalue==1 && all_not_los())){
                domovoi_msg = `${vvalue == 0 ? 'Alle aktuellen Geister haben Sichtlinie!' : 'Derzeit haben keine Geister Sichtlinie'}`
            }
            else{
                while (!$(document.getElementById("LOS").querySelector("#checkbox")).hasClass(["neutral","bad","good"][vvalue+1])){
                    tristate(document.getElementById("LOS"));
                }
                domovoi_msg = `${vvalue == -1 ? 'gelöscht' : vvalue == 0 ? 'markierte nicht' : 'markierte'} sichtlinie`
            }
        }
        else{

            if (vvalue == -1){
                vvalue = 0
            }

            // Common replacements for speed
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['speed'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.startsWith(value[i])){vtext = key}
                }
            }

            for(var i = 0; i < Object.keys(all_speed).length; i++){
                var leven_val = levenshtein_distance(Object.values(all_speed)[i].toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_speed = Object.values(all_speed)[i]
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_speed}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_speed}`
            domovoi_msg += smallest_speed

            if(!$(document.getElementById(rev(all_speed,smallest_speed)).querySelector("#checkbox")).hasClass("block")){
                while (vvalue != {"good":1,"neutral":0}[document.getElementById(rev(all_speed,smallest_speed)).querySelector("#checkbox").classList[0]]){
                    dualstate(document.getElementById(rev(all_speed,smallest_speed)));
                }
            }
            else{
                domovoi_msg = `Geschwindigkeit ${smallest_speed} sind gesperrt!`
            }
        }
        
        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('jagd auf geistige gesundheit') || vtext.startsWith('sanity')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized sanity command")
        running_log[cur_idx]["Type"] = "sanity"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('jagd auf geistige gesundheitunt', "").replace('sanity', "").trim()
        domovoi_msg += "markierte sanity als "

        var smallest_sanity = "Late"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("nicht ")){
            vtext = vtext.replace('nicht ', "").trim()
            vvalue = 0
            domovoi_msg += "nicht "
        }
        else if(vtext.startsWith("klar ") || vtext.startsWith("löschen")){
            vtext = vtext.replace('klar ', "").replace("löschen ","").trim()
            vvalue = 0
            domovoi_msg = "gelöscht "
        }

        // Common replacements for sanity
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['sanity'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_sanity).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_sanity)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_sanity = Object.values(all_sanity)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_sanity}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_sanity}`
        domovoi_msg += smallest_sanity.replace("Average","Normal")

        if(!$(document.getElementById(rev(all_sanity,smallest_sanity)).querySelector("#checkbox")).hasClass("block")){
            while (vvalue != {"good":1,"neutral":0}[document.getElementById(rev(all_sanity,smallest_sanity)).querySelector("#checkbox").classList[0]]){
                dualstate(document.getElementById(rev(all_sanity,smallest_sanity)),false,true);
            }
        }
        else{
            domovoi_msg = `Sanity ${smallest_sanity} sind gesperrt!`
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('timer')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized timer command")
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('timer', "").trim()
        

        if(vtext == "starten"){
            domovoi_msg += "gestarteter weihrauch timer"
            toggle_timer(true,false)
            send_timer(true,false)
        } 
        else{
            domovoi_msg += "angehaltener weihrauch timer"
            toggle_timer(false,true)
            send_timer(false,true)
        }
        

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('warten')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized warten command")
        running_log[cur_idx]["Type"] = "warten"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('warten', "").trim()
        
        if(vtext == "starten"){
            domovoi_msg += "gestarteter warten timer"
            toggle_cooldown_timer(true,false)
            send_cooldown_timer(true,false)
        } 
        else{
            domovoi_msg += "angehaltener warten timer"
            toggle_cooldown_timer(false,true)
            send_cooldown_timer(false,true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('jagddauer')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized hunt duration set command")
        running_log[cur_idx]["Type"] = "hunt duration set"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('jagddauer ', "").trim()
        domovoi_msg += "jagddauer auf "

        if(document.getElementById("num_evidence").value == "-1"){

            var smallest_num = "3"
            var smallest_val = 100
            var prev_value = document.getElementById("cust_hunt_length").value
            var all_hunt_length = ["kurz","niedrig","mittel","lang","hoch"]

            for(var i = 0; i < all_hunt_length.length; i++){
                var leven_val = levenshtein_distance(all_hunt_length[i],vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_num = all_hunt_length[i]
                }
            }
            domovoi_msg += (smallest_num + "stellen")

            smallest_num = {"kurz":"3A","niedrig":"3A","mittel":"3I","lang":"3","hoch":"3"}[smallest_num]
            document.getElementById("cust_hunt_length").value = smallest_num
            if(prev_value != smallest_num){
                filter()
                updateMapDifficulty(smallest_num)
                saveSettings()
            }
        }
        else{
            domovoi_msg = "Benutzerdefinierte Schwierigkeit nicht ausgewählt"
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('jagd')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized jagd command")
        running_log[cur_idx]["Type"] = "jagd"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('jagd', "").trim()
        
        if(vtext == "starten"){
            domovoi_msg += "gestarteter jagd timer"
            toggle_hunt_timer(true,false)
            send_hunt_timer(true,false)
        } 
        else{
            domovoi_msg += "angehaltener jagd timer"
            toggle_hunt_timer(false,true)
            send_hunt_timer(false,true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('anzahl der nachweise')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidence set command")
        running_log[cur_idx]["Type"] = "evidence set"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('anzahl der nachweise', "").trim()
        domovoi_msg += "anzahl der Beweise auf "

        vtext = vtext.replace('drei','3')
        vtext = vtext.replace('zwei','2')
        vtext = vtext.replace('eins','1')
        vtext = vtext.replace('null','0')

        if(document.getElementById("num_evidence").value == "-1"){
            var smallest_num = '3'
            var smallest_val = 100
            var prev_value = document.getElementById("cust_num_evidence").value
            var all_difficulty = ['0','1','2','3']

            for(var i = 0; i < all_difficulty.length; i++){
                var leven_val = levenshtein_distance(all_difficulty[i],vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_num = all_difficulty[i]
                }
            }
            domovoi_msg += smallest_num
            domovoi_msg += " setzen"

            document.getElementById("cust_num_evidence").value = smallest_num ?? "3"
            if(prev_value != smallest_num){
                filter()
                flashMode()
                saveSettings()
            }
        }
        else{
            domovoi_msg = "Benutzerdefinierte Schwierigkeit nicht ausgewählt"
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('schwierigkeit')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized difficulty command")
        running_log[cur_idx]["Type"] = "evidence set"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('schwierigkeit', "").trim()
        domovoi_msg += "Schwierigkeit auf "

        var smallest_num = '3'
        var smallest_val = 100
        var prev_value = document.getElementById("num_evidence").value
        var all_difficulty = ["benutzerdefiniert","apokalypse","wahnsinn","albtraum","profi","fortgeschritten","anfänger"]

        for(var i = 0; i < all_difficulty.length; i++){
            var leven_val = levenshtein_distance(all_difficulty[i],vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_num = all_difficulty[i]
            }
        }
        domovoi_msg += smallest_num
        domovoi_msg += " setzen"

        smallest_num = {"benutzerdefiniert":"-1","apokalypse":"0","wahnsinn":"1","albtraum":"2","profi":"3","fortgeschritten":"3I","anfänger":"3A"}[smallest_num]
        document.getElementById("num_evidence").value = smallest_num
        if(prev_value != smallest_num){
            filter()
            updateMapDifficulty(smallest_num)
            showCustom()
            flashMode()
            saveSettings()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('werkzeuge anzeigen') || vtext.startsWith('filter anzeigen')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized filter/tool command")
        running_log[cur_idx]["Type"] = "filter/werkzeuge"
        console.log(`Heard '${vtext}'`)
        domovoi_msg += "umgeschaltetes menü"

        toggleFilterTools()

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if((vtext.startsWith('karten ') || vtext.startsWith('karte ')) && vtext.endsWith(" anzeigen")){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized karten command")
        running_log[cur_idx]["Type"] = "karten"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('karten ', "").replace('karte ', "").replace(' anzeigen', "").trim()
        domovoi_msg = "Karte anzeigen"

        var smallest_map = "tanglewood"
        var smallest_val = 100

        if(vtext != ""){

            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.includes(value[i])){vtext = vtext.replace(value[i],key)}
                }
            }

            var maps = document.getElementsByClassName("maps_button")

            for(var i = 0; i < maps.length; i++){
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`
        }

        changeMap(document.getElementById(smallest_map),all_maps[smallest_map])
        showMaps(true,false)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if((vtext.startsWith('karten ') || vtext.startsWith('karte ')) && vtext.endsWith(" auswählen")){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized karten command")
        running_log[cur_idx]["Type"] = "karten"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('karten ', "").replace('karte ', "").replace(' auswählen', "").trim()
        domovoi_msg = "Karte auswählen"

        var smallest_map = "tanglewood"
        var smallest_val = 100

        if(vtext != ""){

            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.includes(value[i])){vtext = vtext.replace(value[i],key)}
                }
            }

            var maps = document.getElementsByClassName("maps_button")

            for(var i = 0; i < maps.length; i++){
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`
        }

        changeMap(document.getElementById(smallest_map),all_maps[smallest_map])

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('karten schließen') || vtext.startsWith('karte schließen') || vtext.startsWith('karten ausblenden') || vtext.startsWith('karte ausblenden')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized karten command")
        running_log[cur_idx]["Type"] = "karten"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "karte schließen"

        showMaps(false, true)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('cheat sheet zurücksetzen') || vtext.startsWith('sprite sheet zurücksetzen') || vtext.startsWith('journal zurücksetzen')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized zurücksetzen command")
        console.log(`Heard '${vtext}'`)
        reset()

    }
    else if(vtext.startsWith('aufhören zuzuhören')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized aufhören zuzuhören command")
        console.log(`Heard '${vtext}'`)
        stop_voice()
    }
    else if(
        vtext.startsWith("hallo domo") || vtext.startsWith("hallo domovoi") || 
        vtext.startsWith("guten tag domo") || vtext.startsWith("guten tag domovoi") 
    ){
        domovoi_heard("Guten Tag!")
        reset_voice_status()
    }
    else if(
        vtext.startsWith("move domo") || vtext.startsWith("move domovoi")||
        vtext.startsWith("domo move") || vtext.startsWith("domovoi move")
    ){
        if (user_settings['domo_side'] == 0){
            $("#domovoi").addClass("domovoi-flip")
            $("#domovoi-img").addClass("domovoi-img-flip")
        }
        else{
            $("#domovoi").removeClass("domovoi-flip")
            $("#domovoi-img").removeClass("domovoi-img-flip")
        }
        saveSettings()
        
        reset_voice_status()
    }
    else{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-not-recognized.png)"
        domovoi_not_heard()
        reset_voice_status()
    }


}

if (("webkitSpeechRecognition" in window || "speechRecognition" in window) && !navigator.userAgent.toLowerCase().match(/firefox|fxios|opr/) && !('brave' in navigator)) {
    let speechRecognition = new webkitSpeechRecognition() || new speechRecognition();
    let stop_listen = true
  
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'de';
  
    speechRecognition.onend = () => {
        if(!stop_listen){
            speechRecognition.start(auto=true);
        }
    }

    speechRecognition.onspeechstart = () =>{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-listening.png)"
    }

    speechRecognition.onerror = (error) =>{
        if(error.error != "no-speech")
            console.log(error)
    }
  
    speechRecognition.onresult = (event) => {
        let final_transcript = "";
  
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript = event.results[i][0].transcript;
            }
        }

        final_transcript = final_transcript.replace(/[.,;:-]/g, '')
        parse_speech(final_transcript);
    };
    
    function start_voice(auto=false){
        stop_listen = false
        if(!auto){
            document.getElementById("start_voice").disabled = true
            document.getElementById("stop_voice").disabled = false
            document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
            document.getElementById("voice_recognition_status").className = "pulse_animation"
            document.getElementById("voice_recognition_status").style.display = "block"
            $("#domovoi").show()
            setCookie("voice_recognition_on",true,0.0833)
        }
        speechRecognition.start();
    }

    function stop_voice(){
        stop_listen = true
        document.getElementById("start_voice").disabled = false
        document.getElementById("stop_voice").disabled = true
        document.getElementById("voice_recognition_status").style.display = "none"
        setCookie("voice_recognition_on",false,-1)
        $("#domovoi").hide()
        speechRecognition.stop();
    }

  } else {
    document.getElementById("start_voice").disabled = true
    document.getElementById("stop_voice").disabled = true
    document.getElementById("start_voice").style.display = "none"
    document.getElementById("stop_voice").style.display = "none"
    document.getElementById("voice_recognition_note").innerHTML = "Browser wird nicht unterstützt"
    console.log("Speech Recognition Not Available");
  }


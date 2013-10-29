
document.addEventListener("deviceready", onDeviceReady, false);

var mediaRec;
var recInterval;
var src;
var recTime;

function onDeviceReady(){
    
    readNotes();
}


function startRecording() {
    
    $('#recording_time').empty();
    $('#commands').empty();
    window.location.href = "#record";
    
    recordAudio();

}


// Record audio
//
function recordAudio() {

    // getting the date and time
    var currentdate = new Date();
    console.log(currentdate);

    // the name of the file
    src = "note" + "_" + currentdate.getHours() + "_" + currentdate.getMinutes() +  "_" + currentdate.getSeconds() + ".amr";
    mediaRec = new Media(src, onSuccess, onError);

    // Record audio
    mediaRec.startRecord();

    // Stop recording after 30 sec
    recTime = 0;
    recInterval = setInterval(function() {
        recTime = recTime + 1;
        setAudioPosition(recTime + " sec");
        if (recTime >= 30) {
            stopRecording();
        }
    }, 1000);

}

// stop recording
function stopRecording(){

    // clearing the interval, stop the recording and release resources (fundamental in android)
    clearInterval(recInterval);
    mediaRec.stopRecord();
    mediaRec.release();
    
    // connect to the database
    var db = window.openDatabase("audionotes", "1.0", "audionotes", 1000000);
    
    // add note
    db.transaction(
        function(tx){
            tx.executeSql('CREATE TABLE IF NOT EXISTS NOTES (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name TEXT, duration INTEGER, path TEXT)');
            tx.executeSql('INSERT INTO NOTES (name) VALUES ("' + src + '")');
        },
        onError,
        readNotes); // update listing

    // construct commands
    var output = '<p><a href="#" onClick="startRecording()">New Note</a></p>';
    output += '<p><a href="#" onClick="listNotes()">List of Notes</a></p>';

    $('#commands').html(output);
}

// onSuccess Callback
//
function onSuccess() {
    console.log("recordAudio():Audio Success");
}

// onError Callback
function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

// Set audio position
function setAudioPosition(position) {
    $('#recording_time').html(position);
}

function listNotes(){
    window.location.href = "#main";
}

function readNotes() {                

    // connect to the database
    var db = window.openDatabase("audionotes", "1.0", "audionotes", 1000000);

    // read notes
    db.transaction(function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS NOTES (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name TEXT, duration INTEGER, path TEXT)');
        tx.executeSql('SELECT * FROM NOTES', [], updateListing, onError);
    });

    function updateListing(tx, results) {
        
        var element = $('#listing');
        var output = '';

        for(var i = 0; i < results.rows.length; i++) {
            output += '<p class="center">';
            output += (i + 1) + ' ' + results.rows.item(i).name;
            output += ' | <a href="#" onClick="playNote(' + results.rows.item(i).id + ')">play</a> ';
            output += ' | <a href="#" onClick="deleteNote(' + results.rows.item(i).id + ');">delete</a> ';
            output += '</p>';
        }

        element.html(output);

    }

}

function deleteNote(id) {

    // connect to the database
    var db = window.openDatabase("audionotes", "1.0", "audionotes", 1000000);

    // delete note
    db.transaction(
        function(tx){
            tx.executeSql('DELETE FROM NOTES WHERE id = ' + id);
        },
        onError,
        readNotes); // update listing
}
    
function playNote(id) {

    // get info from the db
    
    // connect to the database
    var db = window.openDatabase("audionotes", "1.0", "audionotes", 1000000);

    // read notes
    db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM NOTES WHERE ID = ' + id, [], playFile, onError);
    });

    // play the audio file
    function playFile(tx, results) {
        
        // this will not work in iOS for sure, probably this is android only
        var url = '/mnt/sdcard/' + results.rows.item(0).name;
        var audiofile = new Media(url,
            function(){
                console.log('Success');
            },
            function() {
                console.log('Error');
            });
        
        audiofile.play();

    }

}

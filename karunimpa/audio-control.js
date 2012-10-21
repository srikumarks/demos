var recording = { normal: null, slow: null };
var largeJump_secs = 1;
var smallJump_secs = 0.1;
var speed = "normal";
var speedFactor = 1;

function showTime(time) {
  var mins = Math.floor( time / 60 );
  var secs = Math.floor( time - mins * 60 );
  var msecs = Math.round( 1000 * (time - mins * 60 - secs) );
  return mins + "m" + secs + "." + msecs + "s = " + (Math.round( 1000 * time ) / 1000) + "s";
}

function updateCurrentTime( which ) {
  if ( speed == which && recording[which] ) {
    $("#currentTime").html( showTime( recording[which].currentTime / speedFactor ) );
  }
}

function onAudioLoaded( which ) {
  recording[which] = document.getElementById("recording_" + which);
  if ( which == "normal" ) {
    $("#duration").html( showTime(recording[which].duration) );
    $("#status").html("Ready");
    recording[which].style.visibility = "visible";
    recording[which].style.display = "inline";
  }
  $("#speed").html( speed );
  updateCurrentTime( speed );
}

function toggleSpeed() {
  if ( recording["normal"] && recording["slow"] ) {
    var paused = recording[speed].paused;
    var time = recording[speed].currentTime / speedFactor;
    recording[speed].pause();
    recording[speed].style.visibility = "hidden";
    recording[speed].style.display = "none";
    speed = (speed == "normal" ? "slow" : "normal");
    speedFactor = (speed == "normal" ? 1 : 2);
    $("#speed").html(speed);
    recording[speed].currentTime = time * speedFactor;
    recording[speed].style.visibility = "visible";
    recording[speed].style.display = "inline";
    if ( paused )
      recording[speed].pause();
    else
      recording[speed].play();
  }
}
      
function playFrom( time ) {
  var rec = recording[speed];
  if ( rec ) {
    rec.currentTime = speedFactor * time;
    rec.play();
  } else {
    alert("Not loaded yet");
  }
}

function playFromFrame( frame ) {
    playFrom( frame / 25.0 );
}

function togglePausePlay() {
  var rec = recording[speed];
  if ( rec ) {
    if ( rec.paused ) {
      rec.play();
    } else {
      rec.pause();
    }
  }
}

$(document).ready( function() {
    $(".smallJump").html(smallJump_secs);
    $(".largeJump").html(largeJump_secs);
    document.onkeypress = function(e) {
      var s = String.fromCharCode(e.keyCode);
      var dt = 0;
      if ( recording[speed] ) {
        // Setup space key to toggle pause/play.
        if ( s == " " ) {
          togglePausePlay();
          e.preventDefault();
        } else if ( s == "[" ) {
          dt = -largeJump_secs;
        } else if ( s == "]" ) {
          dt = largeJump_secs;
        } else if ( s == "{" ) {
          dt = -smallJump_secs;
        } else if ( s == "}" ) {
          dt = smallJump_secs;
        }

        recording[speed].currentTime = Math.min( recording[speed].duration, 
                                          Math.max( recording[speed].currentTime + dt,
                                                    0.0 ) );
      }
    };
    var rec = document.getElementById("recording_normal");
    rec.style.visibility = "hidden";
    rec.style.display = "none";
    rec.addEventListener( "loadeddata", function() { onAudioLoaded("normal"); }, true );
    rec.addEventListener( "timeupdate", function() { updateCurrentTime("normal"); }, true );
    rec.load();
    rec = document.getElementById("recording_slow");
    if ( rec ) {
      rec.style.visibility = "hidden";
      rec.style.display = "none";
      rec.addEventListener( "loadeddata", function() { onAudioLoaded("slow"); }, true );
      rec.addEventListener( "timeupdate", function() { updateCurrentTime("slow"); }, true );
      rec.load();
    }
  });
  

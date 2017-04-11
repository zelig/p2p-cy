var BACKEND_URL='http://localhost:8888';

var m;
var s = 0;;
var clockId;
var runViz = null;
var pauseViz = false;
var networkname = null;
var eventSource = null;
var time_elapsed = new Date();


var startTimer = function () {
  clockId = setInterval(function(){
    s++;
    var temps= s%60;
    m = Math.floor(s/60);
    var val = "" + m + ":" + (temps>9?"":"0") + temps;
    $("#time-elapsed").text(val);
  },1000);
};

var upnodes   = 0;
var uplinks   = 0;

$(document).ready(function() {
  
  $('#pause').prop("disabled",true);

  //click handlers
  $('#play').on('click',function(){ 
    if (pauseViz) {
      setupEventStream();
      pauseViz = false;
      startTimer();
      $("#status-messages").hide();
    } else {
      initializeServer("0"); 
    }
    $('#play').prop("disabled",true);
    $('#pause').prop("disabled",false);
  });

  $("#pause").click(function() {
    if (clockId != null) {
      clearInterval(clockId);
      eventSource.close();
      $("#status-messages").text("Visualization Paused");
      $("#status-messages").show();
      pauseViz = true;
      $('#pause').prop("disabled",true);
      $('#play').prop("disabled",false);
    }
  });
});

function setupEventStream() {
  eventSource = new EventSource(BACKEND_URL + '/' + networkname + "/");

  eventSource.addEventListener("cyupdate", function(e) {
    updateVisualisationWithClass(JSON.parse(e.data));
  });

  eventSource.onerror = function() {
    $("#error-messages").show();
    $("#error-reason").text("Has the backend been shut down?");
    $('#pause').prop("disabled",true);
    $('#play').prop("disabled",true);
    clearInterval(clockId);
  }
}

function initializeServer(networkname_){
  networkname = networkname_;
  $("#error-messages").hide();
  $.post(BACKEND_URL).then(
    function(d){
      console.log("Backend POST init ok");
      //initializeMocker(networkname_);
      setTimeout(function(){
        initializeVisualisationWithClass(networkname_)},1000
      );
      startTimer();
    },
    function(e,s,err) {
      $("#error-messages").show();
      $("#error-reason").text("Is the backend running?");
      $('#play').prop("disabled",false);
      $('#pause').prop("disabled",true);
      console.log("Error sending POST to " + BACKEND_URL);
      console.log(e);
    })
};

//Mocker is currently not used for this visualization
function initializeMocker(networkname_) {
  $.post(BACKEND_URL + "/" + networkname_ + "/mockevents/").then(
    function(d){
      console.log("Backend initializeMocker OK");
    },
    function(e){
      console.log("Error initializing mockevents at " + BACKEND_URL + '0/mockevents/');
      console.log(e);
    })
};

function getGraphNodes(arr) {
   return arr.filter(function(i,e){return e.group === 'nodes'})
      .map(function(i,e){
        return {
          id: e.data.id,
          group: 1
       };
      }).toArray();
}

function getGraphLinks(arr) {
  return arr.filter(function(i,e){return e.group === 'edges'})
      .map(function(i,e){
        return {
          id: e.data.id,
          source: e.data.source,
          target: e.data.target,
          group: 1,
          value: i
        };
      }).toArray();
}

function initializeVisualisationWithClass(networkname_){

  console.log("Initializing visualization");
  var self = this;

  this.visualisation
  = window.visualisation
  = new P2Pd3(d3.select("svg"));

  $.get(BACKEND_URL + '/' + networkname_ + "/").then(
    function(graph){
      console.log("Received graph data from backend");
      //console.log(graph.add);
      self.graphNodes = getGraphNodes($(graph.add));
      //console.log(self.graphNodes);

      upnodes = self.graphNodes.length;
      $("#nodes-up-count").text(upnodes);

      self.graphLinks = getGraphLinks($(graph.add))

      //console.log(self.graphLinks);
      
      uplinks = self.graphLinks.length;
      $("#edges-up-count").text(uplinks);

      self.visualisation.initializeVisualisation(self.graphNodes,self.graphLinks);

      setupEventStream();
    },
    function(e) { 
      console.log("failed getting graph data from backend; can't initialize visualization");
      console.log(e); 
    })
};


function updateVisualisationWithClass(graph) {

  var self = this;

  console.log("Updating visualization with new graph");

  //console.log(graph);
  //console.log($(graph.add));
  //console.log($(graph.remove));
  $('#node-kademlia-table').addClass("stale");
  //new nodes
  var newNodes = getGraphNodes($(graph.add))

  console.log(newNodes);
      
  upnodes += newNodes.length;
  $("#nodes-up-count").text(upnodes);
  $("#nodes-add-count").text(newNodes.length);

  //new connections 
  var newLinks = getGraphLinks($(graph.add))
  console.log(newLinks);

  uplinks += newLinks.length;
  $("#edges-up-count").text(uplinks);
  $("#edges-add-count").text(newLinks.length);

  //down nodes
  var removeNodes = getGraphNodes($(graph.remove))
  console.log(removeNodes);

  upnodes -= removeNodes.length;
  $("#nodes-up-count").text(upnodes);
  $("#nodes-remove-count").text(removeNodes.length);

  //down connections 
  var removeLinks = getGraphLinks($(graph.remove))

  console.log(removeLinks);

  uplinks -= removeLinks.length;
  $("#edges-up-count").text(uplinks);
  $("#edges-remove-count").text(removeLinks.length);

  var triggerMsgs = $(graph.add)
      .filter(function(i,e){return e.group === 'msgs'})
      .map(function(i,e){
        return {
          source: e.data.source,
          target: e.data.target,
          group: 1,
          value: i
        };
      })
      .toArray();

  self.visualisation.updateVisualisation(newNodes,newLinks,removeNodes,removeLinks,triggerMsgs);
};

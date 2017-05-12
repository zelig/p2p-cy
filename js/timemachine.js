$(document).ready(function() {
  timemachine = $("#timemachine").get(0);
  ["input", "change"].forEach(function(evtType) {
    timemachine.addEventListener(evtType,  function() {
      eventLog[evtType] += 1;
      timeStep();
    });
  });

  onRangeChange(timemachine, rangeListener);
});

function onRangeChange(ranger, listener) {

  var inputEvtHasNeverFired = true;
  var rangeValue = {current: undefined, mostRecent: undefined};
  
  ranger.addEventListener("input", function(evt) {
    inputEvtHasNeverFired = false;
    rangeValue.current = evt.target.value;
    if (rangeValue.current !== rangeValue.mostRecent) {
      var forward = true;
      if (rangeValue.current < rangeValue.mostRecent) {
        forward = false;
      }
      listener(evt, forward);
    }
    rangeValue.mostRecent = rangeValue.current;
  });

  ranger.addEventListener("change", function(evt) {
    if (inputEvtHasNeverFired) {
      listener(evt);
    }
  }); 
};

var eventLog = {input: 0, change: 0, custom: 0};
var Timemachine = false;

var timeStep = function() {
};

var rangeListener = function(timeEvent, fwd) {
  eventLog["custom"] += 1;
  
  var eventHistoryIndex = Math.round(timeEvent.target.value*eventHistory.length/100) -1;
  if (eventHistoryIndex > currHistoryIndex ) {
    for (var i=currHistoryIndex; i<=eventHistoryIndex; i++) {
       TimemachineForward(i);
    }
  } else {
    for (var i=currHistoryIndex; i>=eventHistoryIndex; i--) {
      TimemachineBackward(i);
    }
  }

  timeStep();
  currHistoryIndex = eventHistoryIndex;
}

function setupTimemachine() {
  var sim = $("#network-visualisation").clone(true, true);
  sim.attr("id", "timemachine-visualisation");
  sim.appendTo("#visualisation-wrapper");
  Timemachine = new P2Pd3(d3.select("#timemachine-visualisation"));
  var self = Timemachine;
  Timemachine.skipCollectionSetup = true; 
  Timemachine.sidebar = visualisation.sidebar; 
  Timemachine.sidebar.visualisation = self; 
  Timemachine.graphNodes = $.extend(true, [], visualisation.graphNodes);
  Timemachine.graphLinks = $.extend(true, [], visualisation.graphLinks);
  Timemachine.nodesById  = $.extend(true, {}, visualisation.nodesById);
  Timemachine.connsById  = $.extend(true, {}, visualisation.connsById);

  Timemachine.nodeCollection = Timemachine.svg.selectAll("circle").data(self.graphNodes);
  Timemachine.nodeCollection
    .on("click", function(d) {
        //deselect
        Timemachine.nodeCollection.classed("selected", function(p) { if (p) {return p.selected = p.previouslySelected = false;} });
        //select
        d3.select(this).classed("selected",true);
        Timemachine.sidebar.updateSidebarSelectedNode(d);
    }) 
    /*
    .call(d3.drag()
        .on("start", function(d){ self.dragstarted(self.simulation, d); } )
        .on("drag", function(d){ self.dragged(d); } )
        .on("end", function(d){ self.dragended(self.simulation, d); } ));
    */
    ;

  Timemachine.linkCollection = Timemachine.svg.selectAll("line").data(self.graphLinks);

  currHistoryIndex = eventHistory.length -1;
  $("#timemachine").val(100);

  $("#timemachine-visualisation").show();
  $("#network-visualisation").hide();
}

TimemachineForward = function(idx) {
  var evt         = eventHistory[idx];
  var time        = evt.timestamp;
  var content     = evt.content;
  $("#time-elapsed").text(time);
  var newNodes    = [];
  var removeNodes = [];
  var newLinks    = [];
  var removeLinks = [];
  var triggerMsgs = [];

  removeNodes = getGraphNodes($(content.remove));
  removeLinks = getGraphLinks($(content.remove));
  newNodes = getGraphNodes($(content.add));
  newLinks = getGraphLinks($(content.add));

  Timemachine.updateVisualisation(newNodes,newLinks,removeNodes,removeLinks,triggerMsgs); 
  Timemachine.sidebar.updateSidebarCounts(newNodes, newLinks, removeNodes, removeLinks);
}


TimemachineBackward = function(idx) {
  var evt         = eventHistory[idx];
  var time        = evt.timestamp;
  var content     = evt.content;
  $("#time-elapsed").text(time);
  var newNodes    = [];
  var removeNodes = [];
  var newLinks    = [];
  var removeLinks = [];
  var triggerMsgs = [];

  removeNodes = getGraphNodes($(content.add));
  removeLinks = getGraphLinks($(content.add));
  newNodes = getGraphNodes($(content.remove));
  newLinks = getGraphLinks($(content.remove));

  Timemachine.updateVisualisation(newNodes,newLinks,removeNodes,removeLinks,triggerMsgs); 
  Timemachine.sidebar.updateSidebarCounts(newNodes, newLinks, removeNodes, removeLinks);
}

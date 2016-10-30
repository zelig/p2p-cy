var host = "http://192.168.1.3:8888/";
var interval = 1000;
var cy;
var layout_opts = {
  // circle, animated
  name: 'circle',
  fit: true,
  idealEdgeLength: 100,
  nodeOverlap: 20,
  animate: true,
  animationDuration: 800,
  animationEasing: 'ease-out-quint'
}

var initialiseServer = function(){
  return $.ajax({
    dataType: "json",
    url: host,
    method: "POST",
  });
}

var getNodes = function(){
  return $.ajax({
    dataType: "json",
    // url: "init.json",
    url: host+"0/",
    method: "GET",
  });
};

var ajax_error_handler = function(e){
  console.error(e)
};

var initialiseCy = function(initialNodes){
  cy = cytoscape({
    container: $('#cy'), // container to render in
    motionBlur: true,
    // container: document.getElementById('cy'), // container to render in

    layout: layout_opts,

    style: [ // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          'shape': 'hexagon',
          'content': 'data(id)',
          "font-size":"20px",
          "text-valign":"center",
          "text-halign":"center",
          "background-color":"#000",
          "text-outline-color":"#000",
          "text-outline-width":"1px",
          "color":"orange",
          "overlay-padding":"8px",
          "z-index":"10",
          "width": "110px",
          "height": "100px",
          "border-width": "2px",
          "border-color": "orange"
        }
      },

      {
        selector: 'edge',
        style: {
          "font-size":"4px",
          "label": "data(id)",
          'edge-text-rotation': 'autorotate',
          'width': 2,
          'line-color': 'white',
          'target-arrow-color': 'white',
          'target-arrow-shape': 'triangle',
          "curve-style":"haystack",
          "haystack-radius":"0.5",
          "opacity":"0.4",
          "overlay-padding":"3px",
          "z-index":"10"
        }
      },

      {
        selector: '.faded',
        style: {
          'opacity': 0.25,
          'text-opacity': 0
        }
      },    
    ],
    elements: initialNodes
  });
};

var updateCy = function(journal){
    if (journal.add.length > 0) {
      console.log("add", JSON.stringify(journal.add.length))
      cy.add(journal.add);
    };
  
    if (journal.remove.length > 0) {
      console.log("rm", JSON.stringify(journal.remove.length))
      cy.remove('#'+journal.remove.join(",#"));
    };
  
    var layout = cy.makeLayout(layout_opts);
    layout.run();
}

$(function(){
  initialiseServer().then({},function(response){
    console.log('server intialised');
    var initialNodes = false;
    setTimeout(function(){
      getNodes().then(function(response){
        initialiseCy(response.add);
        setInterval(function(){getNodes().then(function(response){updateCy(response);})}, interval);
      },ajax_error_handler)
    },1000)
    
  },ajax_error_handler)
});
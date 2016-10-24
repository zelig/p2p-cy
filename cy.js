$(document).ready(function(){


var cy = cytoscape({
  container: $('#cy'), // container to render in
  // container: document.getElementById('cy'), // container to render in

  layout: {
    name: "spread"
  },

  style: [ // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'content': 'data(id)',
        "font-size":"12px",
        "text-valign":"center",
        "text-halign":"center",
        "background-color":"#000",
        "text-outline-color":"#000",
        "text-outline-width":"1px",
        "color":"#fff",
        "overlay-padding":"6px",
        "z-index":"10"
      }
    },

    {
      selector: 'edge',
      style: {
        "font-size":"4px",
        "label": "data(id)",
        'edge-text-rotation': 'autorotate',
        'width': 2,
        'line-color': '#000',
        'target-arrow-color': '#000',
        // 'target-arrow-shape': 'triangle',
        // "curve-style":"haystack",
        // "haystack-radius":"0.5",
        // "opacity":"0.4",
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
    }
  ]
});

var params = {
  'name': 'spread'
};
var layout = cy.makeLayout(params);
// layout.run();

console.log("hey");

var update = function(journal) {

  if (journal.add.length > 0) {
    console.log(JSON.stringify(journal.add))
    cy.add(journal.add);
  };
  if (journal.remove.length > 0) {
    console.log(JSON.stringify(journal.remove))
    cy.remove('#'+journal.remove.join(",#"));
  };
  var params = {
    // 'name': 'grid'
    'name': 'circle'
    // 'name': 'spread'
  };
  var layout = cy.makeLayout(params);
  layout.run();
};


var set_delay = 1000;
var callout = function () {
        $.ajax({
          dataType: "json",
          url: "http://localhost:8888/0/",
          method: "GET",
          // crossDomain: true,
          // json: {
          //   format: "cy.update"
          // }
        })
        .done(function (response) {
            console.log(response);
            // update the page
            update(response);
        })
        .always(function () {
            setTimeout(callout, set_delay);
        });
    };

// layout.run()
// //clearInterval(id);
$.ajax({
  dataType: "json",
  url: "http://localhost:8888",
  method: "POST",
  // crossDomain: true,
  // json: {
  //   format: "cy.update"
  // }
})
.done(function (response) {
    console.log(response);
})

// // initial call
callout();

});
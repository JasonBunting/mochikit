if (typeof(tests) == 'undefined') { tests = {}; }

tests.test_DragAndDrop = function (t) {
    
    var drag1 = new MochiKit.DragAndDrop.Draggable('drag1', {'revert': true, 'ghosting': true});

    var drop1 = new MochiKit.DragAndDrop.Droppable('drop1', {'hoverclass': 'drop-hover'});
    drop1.activate();
    t.is(hasElementClass('drop1', 'drop-hover'), true, "hoverclass ok");
    drop1.deactivate();
    t.is(hasElementClass('drop1', 'drop-hover'), false, "remove hoverclass ok");
    drop1.destroy();
    
    t.is( isEmpty(MochiKit.DragAndDrop.Droppables.drops), true, "Unregister droppable ok");
    
    var onhover = function (element) {
        t.is(element, getElement('drag1'), 'onhover ok');
    };
    var drop2 = new MochiKit.DragAndDrop.Droppable('drop1', {'onhover': onhover});
    var pos = getElementPosition('drop1');
    pos = {"x": pos.x + 5, "y": pos.y + 5};
    MochiKit.DragAndDrop.Droppables.show({"page": pos}, getElement('drag1'));

    drag1.destroy();
    t.is( isEmpty(MochiKit.DragAndDrop.Draggables.drops), true, "Unregister draggable ok");

    // Formatted tree markup includes labels, whitespace and comments before
    // child lists. Traversal must ignore those nodes when locating a list.
    var tree = document.createElement('ul');
    tree.id = 'sortable-regression';
    tree.innerHTML = '<li id="item_1">Parent\n<!-- before list -->' +
        '<ul><li id="item_2">Leaf\n<!-- no child list --></li></ul></li>';
    document.body.appendChild(tree);
    try {
        MochiKit.Sortable.create(tree, {tree: true, scroll: false});
        var result = MochiKit.Sortable.tree(tree);
        t.is(result.children.length, 1, 'sortable tree keeps its root item');
        t.is(result.children[0].children[0].id, '2', 'sortable tree finds nested list after text and comments');
        t.is(MochiKit.Sortable.serialize(tree),
            'sortable-regression[0][id]=1&sortable-regression[0][0][id]=2',
            'sortable tree serializes formatted markup and text-only leaves');
    } finally {
        MochiKit.Sortable.destroy(tree);
        document.body.removeChild(tree);
    }
    
};


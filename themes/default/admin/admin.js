$(function(){
    $(".dropdown-menu > li > a.trigger").on("click",function(e){
        var current=$(this).next();
        var grandparent=$(this).parent().parent();
        if($(this).hasClass('left-caret')||$(this).hasClass('right-caret'))
            $(this).toggleClass('right-caret left-caret');
        grandparent.find('.left-caret').not(this).toggleClass('right-caret left-caret');
        grandparent.find(".sub-menu:visible").not(current).hide();
        current.toggle();
        e.stopPropagation();
    });
    $(".dropdown-menu > li > a:not(.trigger)").on("click",function(){
        var root=$(this).closest('.dropdown');
        root.find('.left-caret').toggleClass('right-caret left-caret');
        root.find('.sub-menu:visible').hide();
    });
});

function deleteRequest(){
    dataAjax(
        'delete',
        function(data, element){
            console.log(arguments);
            var page = element.getAttribute('data-delete');
            if(data.status){
                alert('Page '+ page +' deleted!');
                $(element).parent().parent().fadeOut('slow', function(){
                    $(element).parent().parent().remove();
                });
            } else {
                console.log(data.error);
                alert(data.error);
            }
        },
        function( err, body ){
            console.log(err);
            alert(err.responseJSON.error);
        }
    );
}

function dataAjax( method , success, error ){
    $('[data-' + method + ']').click(function(){
        var element = this;
        var json = {};
        var page = this.getAttribute('data-delete');
        try {
            json = JSON.parse(this.getAttribute('data-json'));
        } catch( e ){
            console.log(e);
        }
        $.ajax({
            url: page,
            type: method,
            data: json,
            success: function(data){success( data, element );},
            error: function(err){error(err, element);}
        });
    });
}

function dynamicForm( formSelector, submit ){
    var formData = {};

    $(formSelector).find('input[type="text"], input[type="checkbox"], input[type="range"], input[type="password"],input[type="hidden"], textarea, select').each( function( i, elem ){
        console.log(arguments);
        elem = $(elem);
        formData[ elem.attr('name') ] = getElemData( elem );
        elem.change( function(){
            formData[ elem.attr('name') ] = getElemData( elem );
        });
        
    });
    $(formSelector).submit( function( event ) {
        delete formData[ 'undefined' ];
        submit( event, formData );
    });
    return formData;
};

function getElemData( elem ){
    return elem.attr('type') == 'checkbox' || elem.attr('type') == 'radio' ?
    elem.prop('checked'):
    elem.val();
}

function addCodeMirror( elem ) {

    var mac = CodeMirror.keyMap["default"] == CodeMirror.keyMap.macDefault;
    var ctrl = mac ? "Cmd-" : "Ctrl-";
    var map = {fallthrough: "default"};
    var cmds = CodeMirror.commands;


    cmds[map[ctrl + "S"] = "submit"] = function (){
        $(elem).closest("form").submit();
    };

    var options = {
        keyMap: 'sublime',
        showInvisibles: true,
        indentWithTabs: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        theme: "monokai",
        extraKeys: map,
        mode: "pug",
        tabSize: 2,
        lineNumbers: true
    };

    

    return CodeMirror.fromTextArea( elem, options );

}


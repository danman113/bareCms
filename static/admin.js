$(document).ready( function() {
    deleteRequest();
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
};

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
            success: function(data){success( data, element )},
            error: function(err){error(err, element)}
        });
    })
};

function dynamicForm( formSelector, submit){
    var formData = {};
    $(formSelector).find('input[type="text"],input[type="checkbox"], input[type="range"], textarea, select').each( function( i, elem ){
        console.log(arguments);
        elem = $(elem);
        formData[ elem.attr('name') ] = getElemData( elem );
        elem.change( function(){
            formData[ elem.attr('name') ] = getElemData( elem );
        });
    });
    $(formSelector).submit( function( event ) {
        submit( event, formData );
    });
    return formData;
};

function getElemData( elem ){
    return elem.attr('type') == 'checkbox' || elem.attr('type') == 'radio' ?
    elem.prop('checked'):
    elem.val();
}


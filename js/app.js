$(document).ready(function(){
    var app = $('#app');
    var content = $('#content');
    var domainName = {
        local: 'localhost:8000',
        preprod: '',
        prod: ''
    };

    var userAccess = false;

    var ihm = {
        login: '',
        admin: {}
    };

    if(!localStorage){
        return false;
    }

    function getJWT(credentials){
        $.ajax({
            url: 'http://'+domainName['local']+'/api/login_check',
            // contentType: 'application/json',
            // dataType: 'json',
            type: 'POST',
            data: credentials,
            success: function(response){
                // console.log("** Login > Get JWT success ! **");
                // console.log(response);
                localStorage.setItem('token', response.token);
                location.reload();
            },
            error: function(error){
                // console.log("** Login > Get JWT error ! **");
                // console.log(error);
                $('#loginError').empty().attr('class', 'alert alert-danger').append('<strong>Erreur d\'authentification !</strong>');

            }
        });
    }

    function eraseJWT(refresh){
        localStorage.clear();
        // console.log('** Token deleted **');
        if(refresh === true) {
            location.reload();
        }
    }

    function getAdverts(token){
        $.ajax({
            url: 'http://'+domainName['local']+'/api/adverts',
            type: 'GET',
            beforeSend: function(xhr) {
                // console.log('** Pre-flight request **');
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer '+token);
                }
            },
            success: function(response){
                // console.log("*******************************");
                // console.log("** Success, adverts found ! **");
                // console.log("*******************************");
                var adverts = response.adverts;
                var categories = ihm['admin']['categories'] = response.categories;

                for(var j = 0; j < categories.length; j++){
                    ihm['admin']['categories'][j] = "<option value='"+categories[j].id+"'>"+categories[j].label+"</option>";
                }

                console.log(ihm['admin']['categories']);

                var token = localStorage.getItem('token');

                $('.category-select').html(ihm['admin']['categories']);

                for(var i = 0; i < adverts.length; i++){
                    // console.log(adverts[i]);
                    $('#advertsTable').append(
                        "<tr>" +
                            "<td>"+adverts[i].id+"</td>" +
                            "<td>"+adverts[i].uuid+"</td>" +
                            "<td>"+adverts[i].category.label+"</td>" +
                            "<td>"+adverts[i].category.fields+"</td>" +
                            "<td>"+adverts[i].title+"</td>" +
                            "<td>"+adverts[i].description+"</td>" +
                            "<td><button class='btnAdvertDetail btn btn-primary' data-uuid='"+adverts[i].uuid+"'  data-toggle='modal' data-target='#modalShowAdvert'><i class='glyphicon glyphicon-eye-open'></i></button></td>" +
                            "<td><button class='btnAdvertRemove btn btn-danger' data-uuid='"+adverts[i].uuid+"'><i class='glyphicon glyphicon-remove'></i></button></td>" +
                        "</tr>"
                    );
                }

                $(".btnAdvertDetail").click(function() {
                    getAdvert(token, $(this).data('uuid'));
                });

                $(".btnAdvertRemove").click(function(){
                    var aggree = confirm('Es-tu sur de vouloir supprimer cet élement ?');
                    if(aggree){
                        // console.log($(this).data('uuid'));
                        removeAdvert(token, $(this).data('uuid'));
                    }else{
                        return false;
                    }
                });

                $('#submitNewAdvert').click(function() {
                    newAdvert(token);
                });
            },
            error: function(error){
                // console.log("** Error, adverts NOT found ! **");
                if(error.status === 403){
                    $('#errors').empty().attr('class', 'alert alert-danger').append('<strong>Vos accès ont expirés ! Veuillez vous reconnecter...</strong>');
                    setTimeout(function(){
                        eraseJWT(true);
                    }, 1500);
                }
            }
        });
    }

    function removeAdvert(token, uuid){
        $.ajax({
            url: 'http://'+domainName['local']+'/api/advert/'+uuid,
            type: 'DELETE',
            beforeSend: function(xhr) {
                // console.log('** Pre-flight request **');
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer '+token);
                }
            },
            success: function(response){
                // console.log('** Delete > Success, advert removed ! **');
                // console.log(response);
                location.reload();
            },
            error: function(error){
                // console.log("** Delete > Error, advert not deleted ! **");
                // console.log(error);

                $('#details').empty().append("<tr><td colspan='2'><p class='alert alert-danger text-center'><strong>Erreur lors de la modification !</strong></p></td></tr>");
                setTimeout(function(){
                    location.reload();
                }, 1500);
            }
        });
    }

    function getAdvert(token, uuid){
        $.ajax({
            url: 'http://'+domainName['local']+'/api/advert/'+uuid,
            type: 'GET',
            beforeSend: function(xhr) {
                // console.log('** Pre-flight request **');
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer '+token);
                }
            },
            success: function(response){
                // console.log("** Success, this advert found ! **");
                // console.log(response.advert);
                var advert = response.advert;

                ihm['admin']['advert'] =
                    "<table class='table table-striped'>"+
                        "<thead>"+
                            "<tr>"+
                                "<th colspan='2'><span>"+advert.title+"</span>" +
                                    "<button id='btnEditAdvert' class='btn btn-warning pull-right'>Modifier</button>" +
                                "</th>"+
                            "</tr>"+
                        "</thead>"+
                        "<form class='form-horizontal' id='editAdvert'>"+
                        "<tbody id='details'>" +
                            "<tr>"+
                                "<td>Id</td><td>"+advert.id+"</td>"+
                            "</tr>"+
                            "<tr>"+
                                "<td>Uuid</td><td>"+advert.uuid+"</td>"+
                            "</tr>"+
                            "<tr>"+
                                "<td>Category</td><td>" +
                                    "<select name='category' class='form-control category-select' required>" +
                                    "</select><span class='lab'>"+advert.category.label+"</span>" +
                                "</td>"+
                            "</tr>"+
                            "<tr>"+
                                "<td>Title</td><td><input type='hidden' class='form-control' name='title' value='"+advert.title+"'><span>"+advert.title+"</span></td>"+
                            "</tr>"+
                            "<tr>"+
                                "<td>Description</td><td><input type='hidden' class='form-control' name='description' value='"+advert.description+"'><span>"+advert.description+"</span></td>"+
                            "</tr>"+
                            "<tr>"+
                                "<td>Created at</td><td><span>"+advert.created_at+"</td>"+
                            "</tr>"+
                            "<tr>"+
                                "<td colspan='2'><button type='button' class='btn btn-success' id='submitEditAdvert'>Valider les modifications</button></td>"+
                            "</tr>"+
                        "</tbody>"+
                        "</form>"+
                       "</table>";

                $('#advertDetailInfo').html(ihm['admin']['advert']);

                $('#btnEditAdvert').click(function() {
                    editAdvert(token, uuid);
                });
            },
            error: function(error){
                // console.log("** Error - Avert not found ! **");
                console.log(error);
            }
        });
    }

    function newAdvert(token){
        var formData = $('#newAdvert').find(':input').serializeJSON();
        // console.log('** Form data ');
        // console.log(formData);
        $.ajax({
            url: 'http://'+domainName['local']+'/api/advert',
            type: 'POST',
            data: formData,
            beforeSend: function(xhr) {
                // console.log('** Pre-flight request **');
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer '+token);
                }
            },
            success: function(response){
                // console.log('** Success, new advert created ! **');
                $('#modalNewAdvert').find('.modal-body').empty().append("<p class='alert alert-success text-center'><strong>Succès ! Nouvelle annonce créée.</strong></p>");

                setTimeout(function(){
                    location.reload();
                }, 1500);
            },
            error: function(error){
                // console.log('** Error, new advert NOT created ! **');
                // console.log(error);
                $('#modalNewAdvert').find('.modal-body').empty().append("<p class='alert alert-danger text-center'><strong>Erreur ! Nouvelle annonce non créée.</strong></p>");

                setTimeout(function(){
                    location.reload();
                }, 1500);
            }
        })
    }

    function editAdvert(token, uuid) {
        // console.log('** Edit advert ! **');

        $('#details').find('tr td:last-child :input').each(function(){
            $(this).next('span').empty();
            $(this).attr('type', 'text');
            if($(this).css('display', 'none')){
                $(this).css('display', 'inline-block');
            }
            $('.category-select').html(ihm['admin']['categories']);
        });
        $('#submitEditAdvert').click(function(){
            var formData = $('#advertDetailInfo').find(':input').serializeJSON();
            // console.log(formData);
            $.ajax({
                url: 'http://'+domainName['local']+'/api/advert/'+uuid,
                type: 'PUT',
                data: formData,
                beforeSend: function(xhr) {
                    // console.log('** Pre-flight request **');
                    if (token) {
                        xhr.setRequestHeader('Authorization', 'Bearer '+token);
                    }
                },
                success: function(response){
                    // console.log('** Advert updated ! **');
                    $('#details').empty().append("<tr><td colspan='2'><p class='alert alert-success text-center'><strong>Modification accepté ! </strong></p></td></tr>");
                    setTimeout(function(){
                        location.reload();
                    }, 1500);
                },
                error: function(error){
                    // console.log('** Advert not updated ! **');
                    // console.log(error);
                    $('#details').empty().append("<tr><td colspan='2'><p class='alert alert-danger text-center'><strong>Erreur lors de la modification !</strong></p></td></tr>");
                    setTimeout(function(){
                        location.reload();
                    }, 1500);
                }
            })
        });
    }

    if(localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined'){
        console.log('*******************************************************');
        console.log('** JWT found in localStorage - User access is true ! **');
        console.log('*******************************************************');
        userAccess = true;
    }
    else{
        console.log('********************************************');
        console.log('** JWT not found - User access is false ! **');
        console.log('********************************************');
    }

    // TEMPLATE ENGINE - USER ACCESS
    if(!userAccess) {
        eraseJWT(false);
        ihm['login'] =
            "<div class='col-xs-12'>" +
                "<div class='panel panel-default'>"+
                    "<div class='panel-heading'> <h2 class='text-center'><i class='glyphicon glyphicon-user'></i> Login </h2> </div>"+
                    "<div class='panel-body'>"+
                        "<div id='loginError'></div>"+
                        "<form id='loginForm' action='' method='post' class='form-horizontal'>"+
                            "<div class='form-group'>"+
                                "<label for='username' class='col-sm-4 col-sm-offset-1 control-label'> Username / Email </label>"+
                                "<div class='col-sm-4'>"+
                                    "<input type='text' name='username' placeholder='Username' value='john_doe@mail.com' class='form-control' id='username'>"+
                                "</div>"+
                            "</div>"+
                            "<div class='form-group'>"+
                                "<label for='password' class='col-sm-4 col-sm-offset-1 control-label'> Mot de passe </label>"+
                                "<div class='col-sm-4'>"+
                                    "<input type='password' name='password' placeholder='Mot de passe' value='11235' class='form-control' id='password'>"+
                                "</div>"+
                            "</div>"+
                            "<div class='form-group'>"+
                                "<div class='col-sm-offset-4 col-sm-4'>"+
                                    "<input type='button' id='loginBtn' value='Se connecter' class='btn btn-success'>"+
                                "</div>"+
                            "</div>"+
                        "</form>"+
                    "</div>"+
                "</div>"+
            "</div>";
        content.append(ihm['login']);
    }
    else{
        var token = localStorage.getItem('token');
        ihm['admin']['adverts'] =
            "<div class='col-sm-12'>"+
                "<div class='panel panel-default'>"+
                    "<div class='panel-heading'> <h2 class='text-center' id='titlePage'>LBC interface <button class='btn btn-default pull-right' id='logoutBtn'>Se déconnecter</button></h2> </div>"+
                    "<div class='panel-body'>"+
                        "<div class='row'>"+
                            "<div id='searcher' class='col-sm-12'>" +
                                "<button type='button' class='btn btn-info pull-right' data-toggle='modal' data-target='#modalNewAdvert'><i class='glyphicon glyphicon-plus'></i>&nbsp;Créer une annonce</button>" +
                            "</div>"+
                        "</div>"+
                        "<div class='row'>"+
                            "<div id='advertsList' class='col-sm-12'>"+
                                "<div class='table-responsive'>"+
                                    "<table class='table table-striped'>"+
                                        "<thead>"+
                                            "<tr>"+
                                                "<th colspan='10'> <h3>Liste des annonces</h3> </th>"+
                                            "</tr>"+
                                            "<tr>"+
                                                "<th>Id</th>"+
                                                "<th>Uuid</th>"+
                                                "<th>Category</th>"+
                                                "<th>Fields</th>"+
                                                "<th>Title</th>"+
                                                "<th>Description</th>"+
                                                "<th>Visualiser</th>"+
                                                "<th>Supprimer</th>"+
                                            "</tr>"+
                                        "</thead>"+
                                        "<tbody id='advertsTable'></tbody>"+
                                    "</table>"+
                                "</div>"+
                            "</div>" +
                        "</div>"+
                        "<div class='row'>"+
                            "<div class='col-sm-12'>"+
                                "<div id='modalShowAdvert' class='modal fade' role='dialog'>" +
                                    "<div class='modal-dialog'>"+
                                        "<div class='modal-content'>"+
                                            "<div class='modal-header'>"+
                                                "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
                                                "<h4 class='modal-title text-center'> Détails de l'annonce </h4>"+
                                            "</div>"+
                                            "<div class='modal-body' id='advertDetailInfo'>" +
                                            "</div>"+
                                        "</div>"+
                                    "</div>"+
                                "</div>"+
                            "</div>"+
                        "</div>"+
                        "<div class='row'>"+
                            "<div id='newAdvert' class='col-sm-12'>"+
                                "<div id='modalNewAdvert' class='modal fade' role='dialog'>"+
                                    "<div class='modal-dialog'>"+
                                        "<div class='modal-content'>"+
                                            "<div class='modal-header'>"+
                                                "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
                                                "<h4 class='modal-title text-center'>Nouvelle annonce</h4>"+
                                            "</div>"+
                                            "<div class='modal-body'>"+
                                                "<form class='form-horizontal'>"+
                                                    "<div class='form-group'>"+
                                                        "<label class='control-label col-sm-4'>Titre</label>" +
                                                        "<div class='col-sm-8'>"+
                                                            "<input type='text' class='form-control' name='title' value='advert_test' placeholder='advert_test'>"+
                                                        "</div>"+
                                                    "</div>"+
                                                    "<div class='form-group'>"+
                                                        "<label class='control-label col-sm-4'>Description</label>" +
                                                        "<div class='col-sm-8'>"+
                                                            "<input type='text' class='form-control' name='description' value='advert_test' placeholder='advert_test'>"+
                                                        "</div>"+
                                                    "</div>"+
                                                    "<div class='form-group'>"+
                                                        "<label class='control-label col-sm-4'>Category</label>" +
                                                        "<div class='col-sm-8'>"+
                                                            "<select name='category' class='form-control category-select' required>" +
                                                            "</select>" +
                                                        "</div>"+
                                                    "</div>"+
                                                    "<div class='form-group'>"+
                                                        "<div class='col-sm-offset-4 col-sm-4'>"+
                                                            "<button type='button' class='btn btn-success' id='submitNewAdvert'>Créer</button>"+
                                                        "</div>"+
                                                    "</div>"+
                                                "</form>"+
                                            "</div>"+
                                        "</div>"+
                                    "</div>"+
                                "</div>"+
                            "</div>"+
                        "</div>"+
                        "<div class='row'>"+
                            "<div class='col-sm-12'>"+
                            "</div>"+
                        "</div>"+
                        "<div class='row'>"+
                            "<div class='col-xs-12'>" +
                                "<div id='modalShowErrors' class='modal fade' role='dialog'>"+
                                    "<div class='modal-dialog'>"+
                                        "<div class='modal-content'>"+
                                            "<div class='modal-header'>"+
                                                "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
                                                "<h4 class='modal-title text-center'>Information</h4>"+
                                            "</div>"+
                                            "<div class='modal-body'>"+
                                                "<p id='errors'></p>" +
                                            "</div>"+
                                        "</div>"+
                                    "</div>"+
                                "</div>"+
                            "</div>"+
                        "</div>"+
                    "</div>"+
                "</div>"+
            "</div>";
        content.append(ihm['admin']['adverts']);
        getAdverts(token);
    }

    // BUTTON ENGINE
    $("#loginBtn").click(function(){
        var credentials = '{' +
                '"username":"'+$("input[name='username']").val()+
                '", "password":"'+$("input[name='password']").val()+
            '"}';
        getJWT(credentials);
    });
    $("#logoutBtn").click(function(){
        eraseJWT(true);
    });

});
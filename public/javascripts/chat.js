let Chat = function(socket){
    this.socket = socket;
}

//send chat message
Chat.prototype.sendMessage = function(room, text){
    let message = {
        room: room,
        text: text
    };
    this.socket.emit('message', message);
};

//change rooms
Chat.prototype.changeRoom = function(room){
    this.socket.emit('join', {
        newRoom: room
    });
};

Chat.prototype.processCommand = function(cmd){
    let words = cmd.split(' ');
    
    //parse first word from command
    let command = words[0]
                    .substring(1, words[0].length)
                    .toLowerCase();
    let message = false;

    switch(command){
        case 'join':
            words.shift();
            let room = words.join(' ');
            //handle room changing/creating
            this.changeRoom(room);
            break;
        
        case 'nick':
            words.shift();
            let name = words.join(' ');
            //handle name change attempts
            this.socket.emit('nameAttempt', name);
            break;
        
        default:
            //return error message if command unrecognized
            message = 'Unrecognized command';
            break;
    }
    return message;
};

let socket = io.connect();

$(document).ready(function(){
    let chatApp = new Chat(socket);

    //display results of a name change attempt
    socket.on('nameResult', function(result){
        let message;
        
        if(result.success){
            message = 'You are now known as ' + result.name + '.';
        }else{
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    });

    //display results of a room change
    socket.on('joinResult', function(result){
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });

    //display recieved messages
    socket.on('message', function(message){
        let newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });

    //display list of rooms available
    socket.on('rooms', function(rooms){
        $('#room-list').empty();

        for(let room in rooms){
            room = room.substring(1, room.length);
            if(room != ''){
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        //allow click of a room name to change to that room
        $('#room-list div').click(function(){
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });

    //request list of rooms available intermittently
    setInterval(function(){
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();

    //allow submitting the form to send a chat message
    $('#send-form').submit(function(){
        processUserInput(chatApp, socket);
        return false;
    });
});

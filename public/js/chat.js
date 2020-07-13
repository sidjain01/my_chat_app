const socket = io()
//Elements
const $messageForm = document.querySelector('#msg-form')
const $messageInput = $messageForm.querySelector('input')
const $messageButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')
//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//QueryString
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = ()=>{
    const $newMessage = $messages.lastElementChild
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    const visibleHeight = $messages.offsetHeight
    const containerHeight = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight
    if(containerHeight-newMessageHeight<=scrollOffset+newMessageHeight){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format("HH:mm")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage',(locUrl)=>{
    const html = Mustache.render(locationTemplate,{
        username : locUrl.username,
        locUrl : locUrl.url,
        createdAt : moment(locUrl.createdAt).format("HH:mm")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData',({room , users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageButton.setAttribute('disabled', 'disabled')
    $locationButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (ackMessage)=>{
        $messageButton.removeAttribute('disabled')
        $locationButton.removeAttribute('disabled')
        $messageInput.focus()
        $messageInput.value = ""
        console.log('This message was delivered!',ackMessage)
    })
})
$locationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Location feature is not available for your browser')
    }
    $messageButton.setAttribute('disabled', 'disabled')
    $locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position)=>{ 
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longtitude: position.coords.longitude
        }, (ackMessage)=>{
            $messageButton.removeAttribute('disabled')
            $locationButton.removeAttribute('disabled')
            $messageInput.focus()
            $messageInput.value = ""
            console.log('This message was delivered!',ackMessage)
        })
    })
})

socket.emit('join', {username , room},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})
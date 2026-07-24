function login(){
    let email =
        document.getElementById("email").value;
    let password =
        document.getElementById("password").value;


    fetch("/login", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },



        body:JSON.stringify({


            email:email,

            password:password


        })


    })



        .then(response=>{


            if(!response.ok){

                throw new Error();

            }


            return response.json();


        })



        .then(data=>{


            localStorage.setItem(
                "token",
                data.token
            );


            localStorage.setItem(
                "uuid",
                data.uuid
            );



            localStorage.setItem(
                "username",
                data.username
            );



            window.location.href =
                "chat.html";



        })



        .catch(()=>{


            alert(
                "Неверный логин или пароль"
            );


        });


}
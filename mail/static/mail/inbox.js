document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-email').style.display = 'none';

  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    submitForm(event);
    // take email information from form
    const recipientsForm = document.querySelector('#compose-recipients').value;
    const subjectForm =  document.querySelector('#compose-subject').value;
    const bodyForm = document.querySelector('#compose-body').value;

    // send email to the Backend
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipientsForm,
          subject: subjectForm,
          body: bodyForm,
      })
    })
    .then(response => response.json())
    .then(result => {
      // console.log(result);
      if (result) {
        // Clear out composition fields
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
        load_mailbox('sent');
      }
    })
    .catch(error => console.log('Error:', error));
  });
  
}


function submitForm(event){
  //Preventing page refresh
  event.preventDefault();
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';


  //fetch the data and store this data
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      //console.log(emails);
      // ... do something else with emails ...
      load_mailbox_with_emails(emails, mailbox);
  })
  .catch(error => {
      console.log(error);
      throw error;
  });
}


function load_mailbox_with_emails(emails, mailbox) {
  // mailbox appears on the top
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3> <div id="emailDiv"></div>`;
  //emails - table
  const element = document.createElement('table');
  element.setAttribute('class', 'table table-hover');
  const tbody = document.createElement('tbody');

  //for each email we create row of contents on the table
  emails.forEach(email => {
    const tr = document.createElement('tr');
    const divList = document.createElement('td');

    const emailSender = document.createElement('td');
    emailSender.innerHTML = `${email.sender}`;

    const emailSubject = document.createElement('td');
    emailSubject.innerHTML = `${email.subject}`;

    const emailTimestamp = document.createElement('td');
    emailTimestamp.innerHTML = `${email.timestamp}`;

    const check_archive = document.createElement('td');
    
    // we don't need archive in sent mailbox
    if (mailbox !== 'sent') {
      const archiveButton = document.createElement('button');
      archiveButton.setAttribute('class', 'btn btn-outline-secondary');
      if (email.archived) {
        archiveButton.innerHTML = `Unarchive`;
        archiveButton.addEventListener('click', function() {
          archiveEmail(email.id, false);
          load_mailbox('inbox');
          load_mailbox('inbox');
        });
      } else {
        archiveButton.innerHTML = `Archive`;
        archiveButton.addEventListener('click', function() {
          archiveEmail(email.id, true);
          load_mailbox('inbox');
          load_mailbox('inbox');
        });
      }
      check_archive.append(archiveButton);
    }

    emailSender.style.borderTop = 'none';
    emailSubject.style.borderTop = 'none';
    emailTimestamp.style.borderTop = 'none';

    divList.append(emailSender, emailSubject, emailTimestamp);
    tr.append(divList, check_archive);

    // change background color if email is read
    if (email.read) {
      tr.style.backgroundColor = '#C8C8C8';
    }

    tbody.append(tr);
    element.append(tbody);
    divList.addEventListener('click', function() {
      linkTheEmail(email.id);
    });
    document.querySelector('#emails-view').append(element);
  });
}

function linkTheEmail(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';

  //fetch particular email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    // console.log(email);

    // ... do something else with email ...
    displayEmail(email);
    readEmail(email.id);
  }).catch(error => {
    console.log(error);
    throw error;
  });

  document.querySelector('#view-email').innerHTML = '';
}

function readEmail(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });
}

function archiveEmail(email_id, bool) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: bool
    })
  });
}

// email view of particular email
function displayEmail(email) {
  const showEmail = document.querySelector('#view-email');
  const sender = document.createElement('h5');
  sender.innerHTML = `From: ${email.sender}`;
  const receiver = document.createElement('h5');
  receiver.innerHTML = `To: ${email.recipients}`;
  const subject = document.createElement('h5');
  subject.innerHTML = `Subject: ${email.subject}`;
  const timestamp = document.createElement('h5');
  timestamp.innerHTML = `Timestamp: ${email.timestamp}`;

  const replyButton = document.createElement('button');
  replyButton.innerHTML = 'Reply';
  replyButton.setAttribute('class', 'btn btn-outline-primary');
  // replyButton.addEventListener('click', () => reply(email));
  replyButton.onclick = () => reply(email);

  const line = document.createElement('hr');
  showEmail.append(sender, receiver, subject, timestamp, replyButton, line);
  const emailBody = document.createElement('p');
  emailBody.innerHTML = `${email.body}`;
  showEmail.append(emailBody);
}


function reply(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-email').style.display = 'none';

  document.querySelector('#compose-recipients').value = email.sender;
  if (email.subject[0] === 'R' && email.subject[1] === 'e' && email.subject[2] === ':')
  {
    document.querySelector('#compose-subject').value = `${email.subject}`;
  } else {
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.recipients[0]} wrote: `;

  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    // prevent from reloading page
    submitForm(event);
    // take email information from form
    const recipientsForm = document.querySelector('#compose-recipients').value;
    const subjectForm =  document.querySelector('#compose-subject').value;
    const bodyForm = document.querySelector('#compose-body').value;

    // send email to the API
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipientsForm,
          subject: subjectForm,
          body: bodyForm,
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        //console.log(result);
        if (result) {
          // clear compose
          document.querySelector('#compose-recipients').value = '';
          document.querySelector('#compose-subject').value = '';
          document.querySelector('#compose-body').value = '';
          load_mailbox('sent');
        }
    }).catch(error => console.log('Error:', error));
  });
}
Workshops

Def - Object that represents the meeting.
Statuses - Past, Scheduled, Going (Only shown if user completed all of the modules and confirmed their RSVP for workshop)

Workshop Modules

Def - Object that represents a series of prompts for a given workshop.
Statuses - Open, Completed

Workshop Prompts

Def - Object that represents a prompt under a given module.

Workshop RSVP

Def - The "Ticket" to workshops. The RSVP button will show at the top of every workshop as "Locked" / Grayed out. 
To unlock the RSVP option, the user will need to compelete all of the modules in the workshop.

------------------------------------------ API Routes

---- Create

Workshops, Workshop Modules, Workshop Prompts, Workshop Responses, Workshop RSVPS

---- Read

Workshops, Workshop Modules, Workshop Prompts, Workshop Responses, Workshop RSVPS

---- Update

Workshop Module Status, Workshop RSVP Status

---- Delete

Workshops, Workshop Modules, Workshop Prompts


------------------------------------------ API Priv Middleware

---- AuthenticateToken

Checks for Access Token

---- AuthenticateTokenAdmin

Checks for Access Token and Admin Status.

------------------------------------------ API Validation Middleware



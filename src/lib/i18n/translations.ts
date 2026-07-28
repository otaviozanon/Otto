export const translations = {
  pt: {
    // Home
    home: {
      title: "Otto",
      subtitle: "Uno Multiplayer",
      playerCount: "2-15 jogadores",
      namePlaceholder: "Seu nome",
      createRoom: "Criar Sala",
      or: "ou entre em uma sala",
      codePlaceholder: "CODIGO",
      errorName: "Digite seu nome",
      errorCode: "Digite o codigo da sala",
    },
    // Lobby
    lobby: {
      title: "Sala de Espera",
      roomCode: "Codigo da sala",
      copyCode: "Clique para copiar",
      copyLink: "Copiar link da sala",
      players: "Jogadores",
      you: "(voce)",
      host: "HOST",
      startGame: "Iniciar Partida",
      waitingPlayers: "Aguardando jogadores...",
      waitingHost: "Aguardando o host iniciar a partida...",
    },
    // Game
    game: {
      yourTurn: "Sua vez!",
      waiting: "Aguardando...",
      timeLeft: "Tempo restante",
      declareUno: "Declarar UNO!",
      draw: "Comprar",
      pass: "Passar",
      chooseColor: "Escolha uma cor",
    },
    // Game Result
    result: {
      winner: "venceu!",
      cards: "CARTAS",
      playAgain: "Jogar Novamente",
      waiting: "Aguardando",
    },
    // Rules Modal
    rules: {
      title: "Regras do Uno",
      close: "Fechar",
      sections: {
        objective: {
          title: "Objetivo:",
          content: "Ser o primeiro a ficar sem cartas na mao.",
        },
        gameplay: {
          title: "Jogada:",
          content:
            "Jogue uma carta que combine por cor, numero ou tipo com a do topo.",
        },
        specialCards: {
          title: "Cartas Especiais:",
          skip: "Pular (⊘): Proximo perde a vez.",
          reverse: "Inverter (↺): Inverte sentido. 2 jogadores = Pular.",
          draw2: "+2: Proximo compra 2 e perde a vez.",
          wild: "Curinga: Escolha uma nova cor.",
          wild4: "+4: Escolha cor e proximo compra 4.",
        },
        stacking: {
          title: "Empilhamento:",
          content: "Cartas do mesmo tipo empilham (+2/+2, +4/+4, etc).",
        },
        uno: {
          title: "UNO:",
          content:
            "Com 2 cartas, declare UNO antes de jogar a penultima. Sem declarar: +2 cartas.",
        },
        drawing: {
          title: "Comprar:",
          content:
            "Sem carta jogavel, compre do monte. Se servir, pode joga-la.",
        },
        timer: {
          title: "Timer:",
          content:
            "15s por turno. Apos jogar, 10s para jogadas extras. Estourou = compra 1 e passa.",
        },
      },
    },
  },
  en: {
    // Home
    home: {
      title: "Otto",
      subtitle: "Uno Multiplayer",
      playerCount: "2-15 players",
      namePlaceholder: "Your name",
      createRoom: "Create Room",
      or: "or join a room",
      codePlaceholder: "CODE",
      errorName: "Enter your name",
      errorCode: "Enter the room code",
    },
    // Lobby
    lobby: {
      title: "Waiting Room",
      roomCode: "Room code",
      copyCode: "Click to copy",
      copyLink: "Copy room link",
      players: "Players",
      you: "(you)",
      host: "HOST",
      startGame: "Start Game",
      waitingPlayers: "Waiting for players...",
      waitingHost: "Waiting for host to start the game...",
    },
    // Game
    game: {
      yourTurn: "Your turn!",
      waiting: "Waiting...",
      timeLeft: "Time left",
      declareUno: "Declare UNO!",
      draw: "Draw",
      pass: "Pass",
      chooseColor: "Choose a color",
    },
    // Game Result
    result: {
      winner: "wins!",
      cards: "CARDS",
      playAgain: "Play Again",
      waiting: "Waiting",
    },
    // Rules Modal
    rules: {
      title: "Uno Rules",
      close: "Close",
      sections: {
        objective: {
          title: "Objective:",
          content: "Be the first player to get rid of all your cards.",
        },
        gameplay: {
          title: "Gameplay:",
          content:
            "Play a card that matches the top card by color, number, or type.",
        },
        specialCards: {
          title: "Special Cards:",
          skip: "Skip (⊘): Next player loses their turn.",
          reverse: "Reverse (↺): Reverses direction. 2 players = Skip.",
          draw2: "+2: Next player draws 2 and loses turn.",
          wild: "Wild: Choose a new color.",
          wild4: "+4: Choose color and next draws 4.",
        },
        stacking: {
          title: "Stacking:",
          content: "Cards of the same type stack (+2/+2, +4/+4, etc).",
        },
        uno: {
          title: "UNO:",
          content:
            "With 2 cards, declare UNO before playing the second-to-last. No declaration: +2 cards.",
        },
        drawing: {
          title: "Drawing:",
          content:
            "No playable card? Draw from pile. If playable, you can play it.",
        },
        timer: {
          title: "Timer:",
          content:
            "15s per turn. After playing, 10s for extra plays. Timeout = draw 1 and pass.",
        },
      },
    },
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKeys = typeof translations.pt;

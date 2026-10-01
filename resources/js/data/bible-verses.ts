export interface BibleVerse {
    reference: string;
    text: string;
}

/**
 * A fixed, curated rotation — not randomized — so every role sees the exact
 * same verse on the exact same calendar day (computed from the day of the
 * year, see bible-verse-card.tsx), and it's stable across refreshes within
 * that day.
 */
export const BIBLE_VERSES: BibleVerse[] = [
    {
        reference: 'Philippians 4:13',
        text: 'I can do all things through Christ who strengthens me.',
    },
    {
        reference: 'Proverbs 3:5-6',
        text: 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.',
    },
    {
        reference: 'Jeremiah 29:11',
        text: 'For I know the plans I have for you, plans to prosper you and not to harm you, plans to give you hope and a future.',
    },
    {
        reference: 'Joshua 1:9',
        text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
    },
    {
        reference: 'Colossians 3:23',
        text: 'Whatever you do, work at it with all your heart, as working for the Lord, and not for men.',
    },
    {
        reference: 'Proverbs 16:3',
        text: 'Commit to the Lord whatever you do, and he will establish your plans.',
    },
    {
        reference: 'James 1:5',
        text: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.',
    },
    {
        reference: 'Isaiah 40:31',
        text: 'But those who trust in the Lord will find new strength. They will fly high on wings like eagles.',
    },
    {
        reference: 'Psalm 46:1',
        text: 'God is our refuge and strength, an ever-present help in trouble.',
    },
    {
        reference: '2 Timothy 1:7',
        text: 'For God gave us a spirit not of fear but of power and love and self-control.',
    },
    {
        reference: 'Proverbs 1:5',
        text: 'Let the wise listen and add to their learning, and let the discerning get guidance.',
    },
    {
        reference: 'Colossians 3:16',
        text: 'Let the message of Christ dwell among you richly as you teach and admonish one another with all wisdom.',
    },
    {
        reference: 'Ecclesiastes 9:10',
        text: 'Whatever your hand finds to do, do it with all your might.',
    },
    {
        reference: 'Psalm 119:105',
        text: 'Your word is a lamp for my feet, a light on my path.',
    },
    {
        reference: 'Proverbs 4:7',
        text: 'The beginning of wisdom is this: Get wisdom. Though it cost all you have, get understanding.',
    },
    {
        reference: 'Romans 12:2',
        text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.',
    },
    {
        reference: 'Philippians 4:6-7',
        text: 'Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God. And the peace of God will guard your hearts and your minds.',
    },
    {
        reference: 'Deuteronomy 31:6',
        text: 'Be strong and courageous. Do not be afraid or terrified, for the Lord your God goes with you; he will never leave you nor forsake you.',
    },
    {
        reference: 'Galatians 6:9',
        text: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
    },
    {
        reference: 'Proverbs 2:6',
        text: 'For the Lord gives wisdom; from his mouth come knowledge and understanding.',
    },
    {
        reference: 'Psalm 37:5',
        text: 'Commit your way to the Lord; trust in him, and he will act.',
    },
    {
        reference: 'Isaiah 41:10',
        text: 'Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you.',
    },
    {
        reference: 'Proverbs 18:15',
        text: 'The heart of the discerning acquires knowledge, for the ears of the wise seek it out.',
    },
    {
        reference: 'Matthew 5:16',
        text: 'Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.',
    },
    {
        reference: '1 Corinthians 10:31',
        text: 'So whatever you do, whether you eat or drink or whatever you do, do it all for the glory of God.',
    },
    {
        reference: 'Psalm 90:12',
        text: 'Teach us to number our days, that we may gain a heart of wisdom.',
    },
    {
        reference: 'Proverbs 9:9',
        text: 'Instruct the wise and they will be wiser still; teach the righteous and they will add to their learning.',
    },
    {
        reference: 'Romans 8:28',
        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    },
    {
        reference: 'Psalm 121:1-2',
        text: 'I lift up my eyes to the mountains — where does my help come from? My help comes from the Lord, the Maker of heaven and earth.',
    },
    {
        reference: 'Proverbs 22:6',
        text: 'Start children off on the way they should go, and even when they are old they will not turn from it.',
    },
];

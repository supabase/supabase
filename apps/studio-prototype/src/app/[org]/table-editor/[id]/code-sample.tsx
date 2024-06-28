export default function CodeSample() {
  return (
    <div className="flex text-[13px]">
      <div className="text-foreground-muted text-right p-4 min-w-[50px]">
        <div className="line-numbers">
          <p>1</p>
          <p>2</p>
          <p>3</p>
          <p>4</p>
          <p>5</p>
          <p>6</p>
          <p>7</p>
          <p>8</p>
          <p>9</p>
          <p>10</p>
          <p>11</p>
          <p>12</p>
          <p>13</p>
          <p>14</p>
          <p>15</p>
        </div>
      </div>
      <div className="text-black dark:text-white font-mono p-4 flex-1 overflow-auto">
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">SELECT</span>{' '}
          <span className="text-[#FFA500] dark:text-[#DCDCAA]">*</span>{' '}
          <span className="text-[#0000FF] dark:text-[#569CD6]">FROM</span> users;
        </p>
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">INSERT INTO</span> users (
          <span className="text-[#008000] dark:text-[#9CDCFE]">name</span>,{' '}
          <span className="text-[#008000] dark:text-[#9CDCFE]">email</span>)
        </p>
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">VALUES</span> (
          <span className="text-[#A52A2A] dark:text-[#CE9178]">'John Doe'</span>,{' '}
          <span className="text-[#A52A2A] dark:text-[#CE9178]">'john.doe@example.com'</span>);
        </p>
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">UPDATE</span> users
        </p>
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">SET</span> email ={' '}
          <span className="text-[#A52A2A] dark:text-[#CE9178]">'j.doe@example.com'</span>
        </p>
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">WHERE</span> id ={' '}
          <span className="text-[#008000] dark:text-[#B5CEA8]">1</span>;
        </p>
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">DELETE FROM</span> users
        </p>
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">WHERE</span> id ={' '}
          <span className="text-[#008000] dark:text-[#B5CEA8]">2</span>;
        </p>
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">CREATE TABLE</span> products (
        </p>
        <p>
          id <span className="text-[#0000FF] dark:text-[#569CD6]">INT</span> AUTO_INCREMENT,
        </p>
        <p>
          name <span className="text-[#0000FF] dark:text-[#569CD6]">VARCHAR</span>(100),
        </p>
        <p>
          <span className="text-[#0000FF] dark:text-[#569CD6]">PRIMARY KEY</span> (id)
        </p>
        <p>);</p>
      </div>
    </div>
  )
}

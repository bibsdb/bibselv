<?php

namespace App\Command;


use App\Service\TokenService;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class TokenCleanUpCommand extends Command
{
    private TokenService $tokenService;

    protected static $defaultName = 'app:token:cleanup';

    /**
     * TokenCleanUpCommand constructor.
     */
    public function __construct(TokenService $tokenService)
    {
        $this->tokenService = $tokenService;

        parent::__construct();
    }

    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        $this
            ->setDescription('Handle tokens clean up')
            ->addOption('token', null, InputOption::VALUE_OPTIONAL, 'If given only this token will be removed');
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $token = $input->getOption('token');

        if (!is_null($token)) {
            $this->tokenService->removeToken($token);
            $output->writeln('Token removed:' . $token);
        } else {
           $i = $this->tokenService->removeExpiredTokens();
           $output->writeln('Removed ' . $i . ' tokens');
        }

        return 0;
    }
}
